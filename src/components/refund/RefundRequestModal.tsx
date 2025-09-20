import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  finalAmount: number;
  items: Array<{
    product: {
      name: { en: string; bn: string };
      images: Array<{ url: string }>;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
}

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess?: () => void;
}

const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    refundMethod: 'original_payment',
    refundDetails: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      mobileNumber: '',
      provider: 'bkash'
    }
  });

  const refundReasons = [
    { value: 'order_cancelled', label: 'Order Cancelled' },
    { value: 'product_defective', label: 'Product Defective' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'not_as_described', label: 'Not as Described' },
    { value: 'late_delivery', label: 'Late Delivery' },
    { value: 'customer_request', label: 'Customer Request' },
    { value: 'other', label: 'Other' }
  ];

  const refundMethods = [
    { value: 'original_payment', label: 'Original Payment Method' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'mobile_banking', label: 'Mobile Banking' },
    { value: 'store_credit', label: 'Store Credit' }
  ];

  const mobileProviders = [
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'upay', label: 'Upay' }
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason) {
      toast.error('Please select a refund reason');
      return;
    }

    setLoading(true);
    try {
      await api.post('/refunds', {
        orderNumber: order.orderNumber,
        reason: formData.reason,
        description: formData.description,
        refundMethod: formData.refundMethod,
        refundDetails: formData.refundMethod !== 'original_payment' ? formData.refundDetails : undefined
      });

      toast.success('Refund request submitted successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Refund request error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400 && error.response?.data?.existingRefund) {
        const existingRefund = error.response.data.existingRefund;
        toast.error(
          `Refund request already exists for this order (Status: ${existingRefund.status})`,
          {
            duration: 5000,
            style: {
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca'
            }
          }
        );
        
        // Show existing refund details
        console.log('Existing refund details:', existingRefund);
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit refund request');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Request Refund
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Order Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Order Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {order.orderNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  ৳{order.finalAmount || order.totalAmount}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                  {order.orderStatus.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Items:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {order.items.length} item(s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Refund Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refund Reason *
            </label>
            <select
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select a reason</option>
              {refundReasons.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              placeholder="Please provide additional details about your refund request..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Refund Method
            </label>
            <select
              value={formData.refundMethod}
              onChange={(e) => handleInputChange('refundMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            >
              {refundMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refund Details */}
          {formData.refundMethod === 'bank_transfer' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Bank Transfer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.refundDetails.bankName}
                    onChange={(e) => handleInputChange('refundDetails.bankName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.refundDetails.accountNumber}
                    onChange={(e) => handleInputChange('refundDetails.accountNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter account number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={formData.refundDetails.accountHolderName}
                    onChange={(e) => handleInputChange('refundDetails.accountHolderName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter account holder name"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.refundMethod === 'mobile_banking' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Mobile Banking Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Provider
                  </label>
                  <select
                    value={formData.refundDetails.provider}
                    onChange={(e) => handleInputChange('refundDetails.provider', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  >
                    {mobileProviders.map(provider => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.refundDetails.mobileNumber}
                    onChange={(e) => handleInputChange('refundDetails.mobileNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Important Information:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Refund requests are reviewed within 1-2 business days</li>
                  <li>• Approved refunds are processed within 3-5 business days</li>
                  <li>• You will receive email notifications about your refund status</li>
                  <li>• For questions, contact our customer support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.reason}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default RefundRequestModal;
