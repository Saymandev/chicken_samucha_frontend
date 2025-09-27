import { motion } from 'framer-motion';
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  Gift,
  Smartphone,
  XCircle
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import api from '../../utils/api';

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
}

const RefundHistory: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/refunds', {
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });

      if (response.data.success) {
        setRefunds(response.data.refunds);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      console.error('Fetch refunds error:', error);
      toast.error('Failed to fetch refund history');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  // Real-time updates for refund status changes
  useEffect(() => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rest.ourb.live/api';
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

    socket.on('refund-request-created', (data) => {
      console.log('📢 New refund request created:', data);
      // Refresh refunds when new request is created
      fetchRefunds();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchRefunds]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processed':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
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

  const getRefundMethodLabel = (method: string) => {
    switch (method) {
      case 'original_payment':
        return 'Original Payment';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'mobile_banking':
        return 'Mobile Banking';
      case 'store_credit':
        return 'Store Credit';
      default:
        return method;
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Refund History
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your refund requests and their status
          </p>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processed">Processed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Refunds List */}
      {refunds.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No refund requests found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter === 'all' 
              ? "You haven't submitted any refund requests yet"
              : `No refunds with status "${statusFilter}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <motion.div
              key={refund._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Side - Main Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(refund.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {refund.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requested on {new Date(refund.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                      <span className="ml-2 font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        {getRefundMethodIcon(refund.refundMethod)}
                        {getRefundMethodLabel(refund.refundMethod)}
                      </span>
                    </div>
                    {refund.processedAt && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Processed:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {new Date(refund.processedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {refund.description && (
                    <div className="mt-3">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Description:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {refund.description}
                      </p>
                    </div>
                  )}

                   {refund.adminNotes && (
                     <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                       <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">Admin Notes:</span>
                       <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                         {refund.adminNotes}
                       </p>
                     </div>
                   )}

                   {refund.rejectionReason && (
                     <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                       <span className="text-red-700 dark:text-red-300 text-sm font-medium">Rejection Reason:</span>
                       <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                         {refund.rejectionReason}
                       </p>
                     </div>
                   )}

                   {/* Status-specific messages */}
                   {refund.status === 'approved' && (
                     <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                       <span className="text-green-700 dark:text-green-300 text-sm font-medium">✅ Refund Approved</span>
                       <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                         Your refund request has been approved and is being processed. You will receive your refund within 3-5 business days.
                       </p>
                     </div>
                   )}

                   {refund.status === 'processed' && (
                     <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                       <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">🔄 Refund Processing</span>
                       <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                         Your refund is currently being processed. You should receive it soon.
                       </p>
                     </div>
                   )}

                   {refund.status === 'completed' && (
                     <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                       <span className="text-green-700 dark:text-green-300 text-sm font-medium">✅ Refund Completed</span>
                       <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                         Your refund has been successfully processed and completed.
                       </p>
                     </div>
                   )}
                </div>

                {/* Right Side - Status */}
                <div className="flex flex-col items-end gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(refund.status)}`}>
                    {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                  </span>
                  
                  {refund.refundDetails && refund.status === 'approved' && (
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      {refund.refundMethod === 'bank_transfer' && (
                        <div>
                          <p>{refund.refundDetails.bankName}</p>
                          <p>****{refund.refundDetails.accountNumber?.slice(-4)}</p>
                        </div>
                      )}
                      {refund.refundMethod === 'mobile_banking' && (
                        <div>
                          <p>{refund.refundDetails.provider}</p>
                          <p>{refund.refundDetails.mobileNumber}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
    </div>
  );
};

export default RefundHistory;
