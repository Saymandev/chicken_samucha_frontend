import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  Eye,
  Package,
  Search,
  Truck,
  X,
  XCircle
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { AdminOrderCardSkeleton } from '../../components/common/Skeleton';
import { adminAPI } from '../../utils/api';

interface Order {
  id: string;
  _id?: string; // For backward compatibility
  orderNumber: string;
  customer: { 
    name: string; 
    phone: string; 
    email?: string;
    address?: {
      street?: string;
      area?: string;
      city?: string;
      district?: string;
      postalCode?: string;
      landmark?: string;
    };
  };
  items: Array<{ 
    name: { en: string; bn: string } | string; 
    quantity: number; 
    price: number; 
    subtotal: number;
    variantData?: {
      color?: string;
      size?: string;
      weight?: string;
      priceModifier?: number;
    };
  }>;
  totalAmount: number;
  finalAmount: number;
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentInfo: {
    method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'cash_on_delivery' | 'sslcommerz';
    status: 'pending' | 'verified' | 'failed';
    transactionId?: string;
    bankTransactionId?: string;
    paymentNumber?: string;
    paymentGateway?: string;
    provider?: string;
    cardType?: string;
    cardBrand?: string;
    screenshot?: { url: string };
  };
  deliveryInfo?: {
    method: 'delivery' | 'pickup';
    address?: string;
    preferredTime?: string;
    deliveryInstructions?: string;
  };
  refunds?: Array<{
    _id: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed';
    amount: number;
    reason: string;
    createdAt: string;
  }>;
  createdAt: string;
}

const AdminOrders: React.FC = () => {
  
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined
      };
      
      const response = await adminAPI.getAllOrders(params);
      if (response.data.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const API_BASE_URL = process.env.API_URL || 'https://rest.ourb.live/api';
    const socketURL = API_BASE_URL.replace('/api', '');
    
    const newSocket = io(socketURL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-admin-dashboard');
    });

    newSocket.on('new-order', (orderData) => {
      toast.success(`New order received: ${orderData.orderNumber}`);
      fetchOrders();
    });

    newSocket.on('order-status-updated', (data) => {
      // Only show toast if this is from another admin (not from our own action)
      // The local state update already handled the immediate UI change
     
      
      // Refresh orders list to ensure data consistency with server
      setTimeout(() => {
        fetchOrders();
      }, 500); // Small delay to avoid race conditions
    });

    newSocket.on('new-notification', (notification) => {
      // Handle admin notifications if needed
    });


    return () => {
      newSocket.disconnect();
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Update the order status immediately in the local state for instant UI update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          (order.id || order._id) === orderId 
            ? { ...order, orderStatus: newStatus as Order['orderStatus'] }
            : order
        )
      );

      // Show immediate feedback
      toast.success(`Order status updated to ${newStatus}`);

      // Then make the API call
      await adminAPI.updateOrderStatus(orderId, newStatus);
      
      // The Socket.IO event will handle the final refresh to ensure data consistency
    } catch (error) {
      // If the API call fails, revert the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          (order.id || order._id) === orderId 
            ? { ...order } // Revert to original status
            : order
        )
      );
      toast.error('Failed to update order status');
    }
  };

  const verifyPayment = async (orderId: string) => {
    try {
      // Update the payment status immediately in the local state for instant UI update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          (order.id || order._id) === orderId 
            ? { 
                ...order, 
                paymentInfo: { ...order.paymentInfo, status: 'verified' },
                orderStatus: 'confirmed' // Auto-confirm order when payment is verified
              }
            : order
        )
      );

      // Show immediate feedback
      toast.success('Payment verified successfully');

      // Then make the API call
      await adminAPI.verifyPayment(orderId);
      
      // The Socket.IO event will handle the final refresh to ensure data consistency
    } catch (error) {
      // If the API call fails, revert the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          (order.id || order._id) === orderId 
            ? { 
                ...order, 
                paymentInfo: { ...order.paymentInfo, status: 'pending' } // Revert to pending
              }
            : order
        )
      );
      toast.error('Failed to verify payment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderId = (order: Order) => order.id || order._id || '';
  
  const getItemName = (item: any) => {
    if (typeof item.name === 'string') {
      return item.name;
    }
    return item.name?.en || item.name?.bn || 'Unknown Item';
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const confirmOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'confirmed');
  };

  const cancelOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      await updateOrderStatus(orderId, 'cancelled');
    }
  };

  // Handle filter changes
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePaymentFilterChange = (payment: string) => {
    setPaymentFilter(payment);
    setCurrentPage(1); // Reset to first page when filter changes
  };



  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'bkash': return 'bg-pink-100 text-pink-800';
      case 'nagad': return 'bg-orange-100 text-orange-800';
      case 'rocket': return 'bg-purple-100 text-purple-800';
      case 'upay': return 'bg-blue-100 text-blue-800';
      case 'cash_on_delivery': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodLogo = (method: string) => {
    switch (method) {
      case 'bkash': return '📱';
      case 'nagad': return '💰';
      case 'rocket': return '🚀';
      case 'upay': return '💳';
      case 'cash_on_delivery': return '💵';
      default: return '💰';
    }
  };

  const getRefundStatus = (order: Order) => {
    if (!order.refunds || order.refunds.length === 0) return null;
    
    const latestRefund = order.refunds[order.refunds.length - 1];
    return {
      status: latestRefund.status,
      amount: latestRefund.amount,
      reason: latestRefund.reason
    };
  };

  const getRefundBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'processed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Order Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage customer orders and Bangladesh mobile payments
            </p>
          </div>
        </div>

        {/* Quick Actions for Delivery Management - Always visible */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Delivery Management</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => handleStatusFilterChange('out_for_delivery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                statusFilter === 'out_for_delivery' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <Truck className="w-4 h-4" />
              Ready to Mark Delivered
            </button>
            <button
              onClick={() => handleStatusFilterChange('ready')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                statusFilter === 'ready' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Package className="w-4 h-4" />
              Send for Delivery
            </button>
            <button
              onClick={() => handleStatusFilterChange('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                statusFilter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              <Clock className="w-4 h-4" />
              New Orders
            </button>
            <button
              onClick={() => handleStatusFilterChange('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                statusFilter === 'all' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              <Eye className="w-4 h-4" />
              View All
            </button>
            {/* Auto-book toggle */}
            <button
              onClick={async () => {
                try {
                  const s = await adminAPI.getCourierSettings();
                  const next = !s.data.settings.steadfastAutoBook;
                  await adminAPI.updateCourierSettings({ steadfastAutoBook: next });
                  toast.success(`Auto-book ${next ? 'enabled' : 'disabled'}`);
                } catch (e: any) {
                  toast.error('Failed to toggle auto-book');
                }
              }}
              className="ml-auto px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              Toggle Auto-book
            </button>
          </div>
        </div>

        {/* Filters - Always visible */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order number, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                </div>
              )}
              {searchTerm && searchTerm === debouncedSearchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="confirmed">✅ Confirmed</option>
              <option value="preparing">👨‍🍳 Preparing</option>
              <option value="ready">📦 Ready for Delivery</option>
              <option value="out_for_delivery">🚚 Out for Delivery</option>
              <option value="delivered">✅ Delivered</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => handlePaymentFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Payments</option>
              <option value="sslcommerz">SSLCommerz</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>
          </div>
        </div>

        {/* Content Area - Changes based on state */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <AdminOrderCardSkeleton key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'Orders will appear here when customers start placing them'}
            </p>
          </div>
        ) : (
          <>

        {/* Search Results Info */}
        {debouncedSearchTerm && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  Search results for "{debouncedSearchTerm}"
                </span>
                <span className="text-blue-600 dark:text-blue-300 text-sm">
                  ({orders.length} order{orders.length !== 1 ? 's' : ''} found)
                </span>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          </div>
        )}

        {/* Filter Results Info */}
        {(statusFilter !== 'all' || paymentFilter !== 'all') && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-orange-600 dark:text-orange-400">🔍</div>
                <span className="text-orange-800 dark:text-orange-200 font-medium">
                  Active filters:
                </span>
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                    Status: {statusFilter.replace('_', ' ').toUpperCase()}
                  </span>
                )}
                {paymentFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                    Payment: {paymentFilter.toUpperCase()}
                  </span>
                )}
                <span className="text-orange-600 dark:text-orange-300 text-sm">
                  ({orders.length} order{orders.length !== 1 ? 's' : ''} found)
                </span>
              </div>
              <button
                onClick={() => {
                  handleStatusFilterChange('all');
                  handlePaymentFilterChange('all');
                }}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4 mb-8">
          {orders.map((order) => (
            <motion.div
              key={getOrderId(order)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {order.orderNumber}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">👤</span>
                      {order.customer.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">📞</span>
                      {order.customer.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">📅</span>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ৳{order.finalAmount || order.totalAmount}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${getPaymentMethodColor(order.paymentInfo.method)}`}>
                      {getPaymentMethodLogo(order.paymentInfo.method)}
                      {order.paymentInfo.method.toUpperCase()}
                    </span>
                    {getRefundStatus(order) && (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${getRefundBadgeColor(getRefundStatus(order)!.status)}`}>
                        💰 REFUND {getRefundStatus(order)!.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {/* Steadfast Actions */}
                <div className="flex flex-col items-start gap-2 min-w-[220px]">
                  <button
                    onClick={async () => {
                      try {
                        await adminAPI.bookSteadfast(getOrderId(order));
                        toast.success('Booked with Steadfast');
                        fetchOrders();
                      } catch (e: any) {
                        toast.error(e?.response?.data?.message || 'Failed to book');
                      }
                    }}
                    className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm w-full"
                  >
                    Book with Steadfast
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const r = await adminAPI.steadfastStatusByInvoice(getOrderId(order), order.orderNumber);
                        toast.success('Status fetched (see console)');
                        console.log('Steadfast status:', r.data);
                      } catch (e: any) {
                        toast.error(e?.response?.data?.message || 'Failed to fetch status');
                      }
                    }}
                    className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white text-sm w-full"
                  >
                    Check Delivery Status
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const r = await adminAPI.steadfastGetBalance();
                        toast.success(`Balance: ${r.data?.data?.current_balance ?? 'N/A'}`);
                      } catch (e: any) {
                        toast.error('Failed to fetch balance');
                      }
                    }}
                    className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm w-full"
                  >
                    Check Courier Balance
                  </button>
                  <button
                    onClick={async () => {
                      const consignmentId = (order as any).deliveryInfo?.consignmentId;
                      const tracking = (order as any).deliveryInfo?.trackingNumber;
                      const invoice = order.orderNumber;
                      if (!consignmentId && !tracking && !invoice) {
                        toast.error('No consignment/tracking/invoice available');
                        return;
                      }
                      const reason = prompt('Return reason (optional):') || undefined;
                      try {
                        const payload: any = {};
                        if (consignmentId) payload.consignment_id = consignmentId;
                        else if (tracking) payload.tracking_code = tracking;
                        else payload.invoice = invoice;
                        if (reason) payload.reason = reason;
                        const r = await adminAPI.steadfastCreateReturn(payload);
                        toast.success('Return request submitted');
                        console.log('Return request:', r.data);
                      } catch (e: any) {
                        toast.error(e?.response?.data?.message || 'Failed to create return');
                      }
                    }}
                    className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm w-full"
                  >
                    Request Return
                  </button>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Method:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{order.paymentInfo.method.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
                    <p className={`font-medium ${
                      order.paymentInfo.status === 'verified' ? 'text-green-600 dark:text-green-400' :
                      order.paymentInfo.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {order.paymentInfo.status.toUpperCase()}
                    </p>
                  </div>
                  {order.paymentInfo.provider && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Provider:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{order.paymentInfo.provider}</p>
                    </div>
                  )}
                  {order.paymentInfo.paymentNumber && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Payment Number:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{order.paymentInfo.paymentNumber}</p>
                    </div>
                  )}
                  {order.paymentInfo.transactionId && (
                    <div className="sm:col-span-2 lg:col-span-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Transaction ID:</span>
                      <p className="font-medium text-gray-900 dark:text-white break-all">{order.paymentInfo.transactionId}</p>
                    </div>
                  )}
                  {order.paymentInfo.bankTransactionId && (
                    <div className="sm:col-span-2 lg:col-span-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Bank Transaction ID:</span>
                      <p className="font-medium text-gray-900 dark:text-white break-all">{order.paymentInfo.bankTransactionId}</p>
                    </div>
                  )}
                  {order.paymentInfo.cardBrand && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Card Brand:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{order.paymentInfo.cardBrand}</p>
                    </div>
                  )}
                  {order.paymentInfo.cardType && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Card Type:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{order.paymentInfo.cardType}</p>
                    </div>
                  )}
                </div>
                {order.paymentInfo.screenshot && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Payment Screenshot:</span>
                    <button 
                      onClick={() => window.open(order.paymentInfo.screenshot?.url, '_blank')}
                      className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                    >
                      View Screenshot
                    </button>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 flex-wrap gap-2">
                      <div className="text-gray-900 dark:text-gray-100 flex-1 min-w-0">
                        <div className="font-medium">{getItemName(item)} x {item.quantity}</div>
                        {item.variantData && (item.variantData.color || item.variantData.size || item.variantData.weight) && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {item.variantData.color && <span className="mr-2">Color: {item.variantData.color}</span>}
                            {item.variantData.size && <span className="mr-2">Size: {item.variantData.size}</span>}
                            {item.variantData.weight && <span>Weight: {item.variantData.weight}</span>}
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        ৳{(item.subtotal || item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => viewOrderDetails(order)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">View</span>
                </button>
                
                {order.paymentInfo.status === 'pending' && (
                  <button
                    onClick={() => verifyPayment(getOrderId(order))}
                    className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Verify Payment</span>
                    <span className="sm:hidden">Verify</span>
                  </button>
                )}

                {order.orderStatus === 'pending' && (
                  <button
                    onClick={() => confirmOrder(getOrderId(order))}
                    className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Confirm Order</span>
                    <span className="sm:hidden">Confirm</span>
                  </button>
                )}

                {order.orderStatus === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(getOrderId(order), 'preparing')}
                    className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
                  >
                    <Package className="w-4 h-4" />
                    <span className="hidden sm:inline">Start Preparing</span>
                    <span className="sm:hidden">Preparing</span>
                  </button>
                )}

                {order.orderStatus === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(getOrderId(order), 'out_for_delivery')}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors text-sm"
                  >
                    <Truck className="w-4 h-4" />
                    <span className="hidden sm:inline">Send for Delivery</span>
                    <span className="sm:hidden">Send</span>
                  </button>
                )}

                {order.orderStatus === 'out_for_delivery' && (
                  <button
                    onClick={() => updateOrderStatus(getOrderId(order), 'delivered')}
                    className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark as Delivered</span>
                    <span className="sm:hidden">Delivered</span>
                  </button>
                )}

                {/* Only show Cancel button for pending and confirmed orders */}
                {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                  <button 
                    onClick={() => cancelOrder(getOrderId(order))}
                    className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel Order</span>
                    <span className="sm:hidden">Cancel</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mb-8">
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

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Order Details - {selectedOrder.orderNumber}
                  </h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 self-end sm:self-auto"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Customer Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Name:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customer.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Phone:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customer.phone}</p>
                      </div>
                      {selectedOrder.customer.email && (
                        <div className="sm:col-span-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Email:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customer.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Information - Only show for delivery orders */}
                {selectedOrder.deliveryInfo?.method === 'delivery' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Delivery Information
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Delivery Method:</span>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {selectedOrder.deliveryInfo.method}
                          </p>
                        </div>
                        
                        {/* Show delivery address from deliveryInfo or construct from customer address */}
                        {(selectedOrder.deliveryInfo.address || selectedOrder.customer.address) && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">Delivery Address:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedOrder.deliveryInfo.address || 
                                `${selectedOrder.customer.address?.street || ''} ${selectedOrder.customer.address?.area || ''}, ${selectedOrder.customer.address?.city || 'Rangpur'}, ${selectedOrder.customer.address?.district || 'Rangpur'}`
                              }
                            </p>
                            {selectedOrder.customer.address?.landmark && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                Landmark: {selectedOrder.customer.address.landmark}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {selectedOrder.deliveryInfo.preferredTime && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">Preferred Time:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedOrder.deliveryInfo.preferredTime}
                            </p>
                          </div>
                        )}
                        
                        {selectedOrder.deliveryInfo.deliveryInstructions && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">Delivery Instructions:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedOrder.deliveryInfo.deliveryInstructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pickup Information - Show for pickup orders */}
                {selectedOrder.deliveryInfo?.method === 'pickup' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Pickup Information
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Package className="w-5 h-5" />
                        <span className="font-medium">Customer will pickup from restaurant</span>
                      </div>
                      {selectedOrder.deliveryInfo.preferredTime && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Preferred Pickup Time:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedOrder.deliveryInfo.preferredTime}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Status */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Status</h3>
                  <div className="flex gap-4 items-center">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                      {selectedOrder.orderStatus.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Items</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{getItemName(item)}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Quantity: {item.quantity}</p>
                            {item.variantData && (item.variantData.color || item.variantData.size || item.variantData.weight) && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.variantData.color && <span className="mr-3">Color: {item.variantData.color}</span>}
                                {item.variantData.size && <span className="mr-3">Size: {item.variantData.size}</span>}
                                {item.variantData.weight && <span>Weight: {item.variantData.weight}</span>}
                                {item.variantData.priceModifier && item.variantData.priceModifier !== 0 && (
                                  <span className="ml-2 text-orange-600">
                                    ({item.variantData.priceModifier > 0 ? '+' : ''}৳{item.variantData.priceModifier})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">৳{(item.subtotal || item.price * item.quantity)}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">৳{item.price} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">৳{selectedOrder.finalAmount || selectedOrder.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Payment Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Payment Method:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.paymentInfo.method.toUpperCase()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Payment Status:</span>
                        <p className={`font-medium ${
                          selectedOrder.paymentInfo.status === 'verified' ? 'text-green-600 dark:text-green-400' :
                          selectedOrder.paymentInfo.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {selectedOrder.paymentInfo.status.toUpperCase()}
                        </p>
                      </div>
                      {selectedOrder.paymentInfo.transactionId && (
                        <div className="md:col-span-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Transaction ID:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.paymentInfo.transactionId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  {selectedOrder.paymentInfo.status === 'pending' && (
                    <button
                      onClick={() => {
                        verifyPayment(getOrderId(selectedOrder));
                        setShowOrderModal(false);
                      }}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify Payment
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'pending' && (
                    <button
                      onClick={() => {
                        confirmOrder(getOrderId(selectedOrder));
                        setShowOrderModal(false);
                      }}
                      className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      Confirm Order
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'confirmed' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(getOrderId(selectedOrder), 'preparing');
                        setShowOrderModal(false);
                      }}
                      className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      Start Preparing
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'preparing' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(getOrderId(selectedOrder), 'ready');
                        setShowOrderModal(false);
                      }}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      Mark Ready
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'ready' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(getOrderId(selectedOrder), 'out_for_delivery');
                        setShowOrderModal(false);
                      }}
                      className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      <Truck className="w-4 h-4" />
                      Send for Delivery
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'out_for_delivery' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(getOrderId(selectedOrder), 'delivered');
                        setShowOrderModal(false);
                      }}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Delivered
                    </button>
                  )}

                  {(selectedOrder.orderStatus === 'pending' || selectedOrder.orderStatus === 'confirmed') && (
                    <button
                      onClick={() => {
                        cancelOrder(getOrderId(selectedOrder));
                        setShowOrderModal(false);
                      }}
                      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
