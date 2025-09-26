import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    Edit,
    Eye,
    Plus,
    Search,
    Tag,
    ToggleLeft,
    ToggleRight,
    Trash2
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminOrderCardSkeleton } from '../../components/common/Skeleton';
import { adminAPI } from '../../utils/api';

interface FlashSale {
  _id: string;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  startTime: string;
  endTime: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  products: Array<{
    product: {
      _id: string;
      name: { en: string; bn: string };
      images: Array<{ url: string }>;
    };
    originalPrice: number;
    flashSalePrice: number;
    stockLimit?: number;
    soldCount: number;
  }>;
  isActive: boolean;
  backgroundColor: string;
  textColor: string;
  priority: number;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AdminFlashSales: React.FC = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState<FlashSale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchFlashSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const response = await adminAPI.getAllFlashSales(params);
      if (response.data.success) {
        setFlashSales(response.data.flashSales);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Fetch flash sales error:', error);
      toast.error('Failed to fetch flash sales');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  const handleToggleStatus = async (flashSaleId: string) => {
    try {
      const response = await adminAPI.toggleFlashSaleStatus(flashSaleId);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchFlashSales();
      }
    } catch (error) {
      console.error('Toggle flash sale status error:', error);
      toast.error('Failed to toggle flash sale status');
    }
  };

  const handleDeleteFlashSale = async (flashSaleId: string) => {
    if (!window.confirm('Are you sure you want to delete this flash sale?')) {
      return;
    }

    try {
      const response = await adminAPI.deleteFlashSale(flashSaleId);
      if (response.data.success) {
        toast.success('Flash sale deleted successfully');
        fetchFlashSales();
      }
    } catch (error) {
      console.error('Delete flash sale error:', error);
      toast.error('Failed to delete flash sale');
    }
  };

  const getStatusBadge = (flashSale: FlashSale) => {
    const now = new Date();
    const startTime = new Date(flashSale.startTime);
    const endTime = new Date(flashSale.endTime);

    if (!flashSale.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Inactive</span>;
    }

    if (now < startTime) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">Upcoming</span>;
    }

    if (now >= startTime && now <= endTime) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">Active</span>;
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">Expired</span>;
  };

  const getRemainingTime = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flash Sales Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage flash sales campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Flash Sale</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search flash sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Flash Sales List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <AdminOrderCardSkeleton key={i} />
            ))}
          </div>
        ) : flashSales.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Flash Sales Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No flash sales match your current filters.' 
                : 'Get started by creating your first flash sale campaign.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Flash Sale
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {flashSales.map((flashSale) => (
              <motion.div
                key={flashSale._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {flashSale.title.en}
                      </h3>
                      {getStatusBadge(flashSale)}
                      <span className="text-sm text-gray-500">
                        Priority: {flashSale.priority}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      {/* Timing Info */}
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Start: {formatDate(flashSale.startTime)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>End: {formatDate(flashSale.endTime)}</span>
                        </div>
                        <div className="text-sm font-medium text-orange-600">
                          {getRemainingTime(flashSale.endTime)}
                        </div>
                      </div>

                      {/* Discount Info */}
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Discount: {flashSale.discountType === 'percentage' ? `${flashSale.discountValue}%` : `৳${flashSale.discountValue}`}
                        </div>
                        {flashSale.maxDiscountAmount && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Max: ৳{flashSale.maxDiscountAmount}
                          </div>
                        )}
                      </div>

                      {/* Products Info */}
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Products: {flashSale.products.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Sold: {flashSale.products.reduce((sum, p) => sum + p.soldCount, 0)}
                        </div>
                      </div>

                      {/* Creator Info */}
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Created by: {flashSale.createdBy.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(flashSale.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Product Preview */}
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 overflow-x-auto">
                        {flashSale.products.slice(0, 5).map((item) => (
                          <div key={item.product._id} className="flex-shrink-0">
                            <img
                              src={item.product.images[0]?.url || '/placeholder.png'}
                              alt={item.product.name.en}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          </div>
                        ))}
                        {flashSale.products.length > 5 && (
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                            +{flashSale.products.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedFlashSale(flashSale);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedFlashSale(flashSale);
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(flashSale._id)}
                      className={`p-2 rounded-lg transition-colors ${
                        flashSale.isActive
                          ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title={flashSale.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {flashSale.isActive ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteFlashSale(flashSale._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals would go here - Create/Edit and Details modals */}
      {/* For now, just showing placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {selectedFlashSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Flash sale creation form will be implemented here.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedFlashSale(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                {selectedFlashSale ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedFlashSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{selectedFlashSale.title.en}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Detailed view of flash sale with products, analytics, etc.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedFlashSale(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFlashSales;
