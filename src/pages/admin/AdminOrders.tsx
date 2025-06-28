import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  Eye,
  Package,
  Search,
  Truck,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

interface Order {
  id: string;
  _id?: string; // For backward compatibility
  orderNumber: string;
  customer: { name: string; phone: string; email?: string };
  items: Array<{ 
    name: { en: string; bn: string } | string; 
    quantity: number; 
    price: number; 
    subtotal: number;
  }>;
  totalAmount: number;
  finalAmount: number;
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentInfo: {
    method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'cash_on_delivery';
    status: 'pending' | 'verified' | 'failed';
    transactionId?: string;
    screenshot?: { url: string };
  };
  createdAt: string;
}

const AdminOrders: React.FC = () => {
  
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined
      };
      
      const response = await adminAPI.getAllOrders(params);
      if (response.data.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const verifyPayment = async (orderId: string) => {
    try {
      await adminAPI.verifyPayment(orderId);
      toast.success('Payment verified successfully');
      fetchOrders();
    } catch (error) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Quick Actions for Delivery Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Delivery Management</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setStatusFilter('out_for_delivery')}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <Truck className="w-4 h-4" />
              Ready to Mark Delivered
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Package className="w-4 h-4" />
              Send for Delivery
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              <Clock className="w-4 h-4" />
              New Orders
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              View All
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Payments</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="upay">Upay</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4 mb-8">
          {orders.map((order) => (
            <motion.div
              key={getOrderId(order)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {order.orderNumber}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{order.customer.name}</span>
                    <span>{order.customer.phone}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ৳{order.finalAmount || order.totalAmount}
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${getPaymentMethodColor(order.paymentInfo.method)}`}>
                      {getPaymentMethodLogo(order.paymentInfo.method)}
                      {order.paymentInfo.method.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {order.paymentInfo.transactionId && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Transaction ID:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{order.paymentInfo.transactionId}</p>
                    </div>
                  )}
                </div>
                {order.paymentInfo.screenshot && (
                  <div className="mt-2">
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
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-gray-900 dark:text-gray-100">{getItemName(item)} x {item.quantity}</span>
                      <span className="font-medium text-gray-900 dark:text-white">৳{(item.subtotal || item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={() => viewOrderDetails(order)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                
                {order.paymentInfo.status === 'pending' && (
                  <button
                    onClick={() => verifyPayment(getOrderId(order))}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify Payment
                  </button>
                )}

                {order.orderStatus === 'pending' && (
                  <button
                    onClick={() => confirmOrder(getOrderId(order))}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Confirm Order
                  </button>
                )}

                {order.orderStatus === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(getOrderId(order), 'preparing')}
                    className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    Start Preparing
                  </button>
                )}

                {order.orderStatus === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(getOrderId(order), 'out_for_delivery')}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Out for Delivery
                  </button>
                )}

                {order.orderStatus === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(getOrderId(order), 'out_for_delivery')}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Send for Delivery
                  </button>
                )}

                {order.orderStatus === 'out_for_delivery' && (
                  <button
                    onClick={() => updateOrderStatus(getOrderId(order), 'delivered')}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Delivered
                  </button>
                )}

                <button 
                  onClick={() => cancelOrder(getOrderId(order))}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Order
                </button>
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

        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'Orders will appear here when customers start placing them'}
            </p>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Order Details - {selectedOrder.orderNumber}
                  </h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Customer Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Name:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customer.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Phone:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customer.phone}</p>
                      </div>
                      {selectedOrder.customer.email && (
                        <div className="md:col-span-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Email:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customer.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{getItemName(item)}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Quantity: {item.quantity}</p>
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
