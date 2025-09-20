import { motion } from 'framer-motion';
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  Gift,
  RefreshCw,
  Search,
  Smartphone,
  XCircle
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { adminAPI } from '../../utils/api';

interface Refund {
  _id: string;
  orderNumber: string;
  amount: number;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed';
  refundMethod: 'original_payment' | 'bank_transfer' | 'mobile_banking' | 'store_credit';
  refundDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    mobileNumber?: string;
    provider?: string;
  };
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
  order: {
    orderNumber: string;
    orderStatus: string;
    totalAmount: number;
    createdAt: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  processedBy?: {
    name: string;
  };
}

const AdminRefunds: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllRefunds({
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearchTerm || undefined
      });

      if (response.data.success) {
        setRefunds(response.data.refunds);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      console.error('Fetch refunds error:', error);
      toast.error('Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  // Real-time updates for refund status changes
  useEffect(() => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://chicken-samucha-backend.onrender.com';
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to server for refund updates');
    });

    socket.on('refund-status-updated', (data) => {
      console.log('📢 Refund status updated:', data);
      // Refresh refunds when status changes
      fetchRefunds();
    });

    socket.on('new-refund-request', (data) => {
      console.log('📢 New refund request:', data);
      // Refresh refunds when new request is created
      fetchRefunds();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchRefunds]);

  // Handle filter changes
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleStatusUpdate = async (refundId: string, status: string, notes?: string, rejectionReason?: string) => {
    try {
      setActionLoading(refundId);
      await adminAPI.updateRefundStatus(refundId, {
        status,
        adminNotes: notes,
        rejectionReason
      });

      toast.success(`Refund ${status} successfully`);
      fetchRefunds();
      setShowRefundModal(false);
    } catch (error: any) {
      console.error('Update refund status error:', error);
      toast.error('Failed to update refund status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processed':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  const getRefundMethodIcon = (method: string) => {
    switch (method) {
      case 'original_payment':
        return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer':
        return <Banknote className="w-4 h-4" />;
      case 'mobile_banking':
        return <Smartphone className="w-4 h-4" />;
      case 'store_credit':
        return <Gift className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      order_cancelled: 'Order Cancelled',
      product_defective: 'Product Defective',
      wrong_item: 'Wrong Item Received',
      not_as_described: 'Not as Described',
      late_delivery: 'Late Delivery',
      customer_request: 'Customer Request',
      other: 'Other'
    };
    return reasonMap[reason] || reason;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Refund Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customer refund requests
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order number, customer name, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processed">Processed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchRefunds}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

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
                ({refunds.length} refund{refunds.length !== 1 ? 's' : ''} found)
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
      {statusFilter !== 'all' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-orange-600 dark:text-orange-400">🔍</div>
              <span className="text-orange-800 dark:text-orange-200 font-medium">
                Active filter:
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                Status: {statusFilter.toUpperCase()}
              </span>
              <span className="text-orange-600 dark:text-orange-300 text-sm">
                ({refunds.length} refund{refunds.length !== 1 ? 's' : ''} found)
              </span>
            </div>
            <button
              onClick={() => handleStatusFilterChange('all')}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 text-sm font-medium"
            >
              Clear filter
            </button>
          </div>
        </div>
      )}

      {/* Refunds Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {refunds.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No refund requests found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? "No refunds match your current filters"
                : "No refund requests have been submitted yet"
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order/Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {refunds.map((refund) => (
                  <motion.tr
                    key={refund._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {refund.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {refund.customer.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {refund.customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ৳{refund.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getReasonLabel(refund.reason)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                        {getRefundMethodIcon(refund.refundMethod)}
                        {refund.refundMethod.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(refund.status)}`}>
                        {getStatusIcon(refund.status)}
                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(refund.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRefund(refund);
                          setShowRefundModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === i + 1
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Refund Detail Modal */}
      {showRefundModal && selectedRefund && (
        <RefundDetailModal
          refund={selectedRefund}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedRefund(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          loading={actionLoading === selectedRefund._id}
        />
      )}
    </div>
  );
};

// Refund Detail Modal Component
interface RefundDetailModalProps {
  refund: Refund;
  onClose: () => void;
  onStatusUpdate: (refundId: string, status: string, notes?: string, rejectionReason?: string) => void;
  loading: boolean;
}

const RefundDetailModal: React.FC<RefundDetailModalProps> = ({
  refund,
  onClose,
  onStatusUpdate,
  loading
}) => {
  const [adminNotes, setAdminNotes] = useState(refund.adminNotes || '');
  const [rejectionReason, setRejectionReason] = useState('');

  const getReasonLabel = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      order_cancelled: 'Order Cancelled',
      product_defective: 'Product Defective',
      wrong_item: 'Wrong Item Received',
      not_as_described: 'Not as Described',
      late_delivery: 'Late Delivery',
      customer_request: 'Customer Request',
      other: 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const handleApprove = () => {
    onStatusUpdate(refund._id, 'approved', adminNotes);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    onStatusUpdate(refund._id, 'rejected', adminNotes, rejectionReason);
  };

  const handleProcess = () => {
    onStatusUpdate(refund._id, 'processed', adminNotes);
  };

  const handleComplete = () => {
    onStatusUpdate(refund._id, 'completed', adminNotes);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Refund Details - {refund.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {refund.customer.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {refund.customer.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {refund.customer.phone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Refund Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    ৳{refund.amount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {getReasonLabel(refund.reason)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Method:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {refund.refundMethod.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {refund.description && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Customer Description</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {refund.description}
              </p>
            </div>
          )}

          {/* Refund Details */}
          {refund.refundDetails && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Refund Details</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm">
                {refund.refundMethod === 'bank_transfer' && (
                  <div className="space-y-1">
                    <div>Bank: {refund.refundDetails.bankName}</div>
                    <div>Account: {refund.refundDetails.accountNumber}</div>
                    <div>Holder: {refund.refundDetails.accountHolderName}</div>
                  </div>
                )}
                {refund.refundMethod === 'mobile_banking' && (
                  <div className="space-y-1">
                    <div>Provider: {refund.refundDetails.provider}</div>
                    <div>Number: {refund.refundDetails.mobileNumber}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Notes
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add notes about this refund request..."
            />
          </div>

          {/* Rejection Reason (only for reject action) */}
          {refund.status === 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason (if rejecting)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                placeholder="Reason for rejection (required if rejecting)..."
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>

          {refund.status === 'pending' && (
            <>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve
              </button>
            </>
          )}

          {refund.status === 'approved' && (
            <button
              onClick={handleProcess}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Mark as Processed
            </button>
          )}

          {refund.status === 'processed' && (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Mark as Completed
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminRefunds;
