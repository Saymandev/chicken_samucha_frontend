import { motion } from 'framer-motion';
import {
    Calendar,
    Edit,
    Eye,
    Gift,
    Plus,
    Search,
    Star,
    ToggleLeft,
    ToggleRight,
    Trash2,
    TrendingUp
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminTableSkeleton } from '../../components/common/Skeleton';
import PromotionFormModal from '../../components/promotion/PromotionFormModal';
import { adminAPI } from '../../utils/api';

interface Promotion {
  _id: string;
  title: {
    en: string;
    bn: string;
  };
  description: {
    en: string;
    bn: string;
  };
  type: 'discount' | 'special_offer' | 'announcement' | 'seasonal' | 'flash_sale';
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  discountValue: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  priority: number;
  analytics: {
    views: number;
    clicks: number;
    conversions: number;
  };
  createdAt: string;
}

const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        type: typeFilter !== 'all' ? typeFilter : undefined
      };
      
      const response = await adminAPI.getPromotions(params);
      if (response.data.success) {
        setPromotions(response.data.promotions || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to fetch promotions');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const togglePromotionStatus = async (promotionId: string) => {
    try {
      await adminAPI.togglePromotionStatus(promotionId);
      toast.success('Promotion status updated');
      fetchPromotions();
    } catch (error) {
      toast.error('Failed to update promotion status');
    }
  };

  const deletePromotion = async (promotionId: string) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      await adminAPI.deletePromotion(promotionId);
      toast.success('Promotion deleted successfully');
      fetchPromotions();
    } catch (error) {
      toast.error('Failed to delete promotion');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'special_offer':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'flash_sale':
        return <Gift className="w-4 h-4 text-red-500" />;
      default:
        return <Gift className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (promotion: Promotion) => {
    const now = new Date();
    const validFrom = new Date(promotion.validFrom);
    const validUntil = new Date(promotion.validUntil);

    if (!promotion.isActive) return 'bg-gray-100 text-gray-800';
    if (now < validFrom) return 'bg-blue-100 text-blue-800';
    if (now > validUntil) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (promotion: Promotion) => {
    const now = new Date();
    const validFrom = new Date(promotion.validFrom);
    const validUntil = new Date(promotion.validUntil);

    if (!promotion.isActive) return 'Inactive';
    if (now < validFrom) return 'Upcoming';
    if (now > validUntil) return 'Expired';
    return 'Active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Promotion Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage promotional campaigns
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPromotion(null);
            setShowPromotionModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Promotion
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search promotions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="upcoming">Upcoming</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Types</option>
          <option value="discount">Discount</option>
          <option value="special_offer">Special Offer</option>
          <option value="flash_sale">Flash Sale</option>
          <option value="seasonal">Seasonal</option>
          <option value="announcement">Announcement</option>
        </select>
      </div>

      {/* Promotions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <AdminTableSkeleton rows={5} />
        ) : promotions.length === 0 ? (
          <div className="p-8 text-center">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No promotions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first promotion to get started
            </p>
            <button
              onClick={() => {
                setSelectedPromotion(null);
                setShowPromotionModal(true);
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Create Promotion
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Promotion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Analytics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {promotions.map((promotion) => (
                  <motion.tr
                    key={promotion._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getTypeIcon(promotion.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {promotion.title.en}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Priority: {promotion.priority}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {promotion.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(promotion)}`}>
                        {getStatusText(promotion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(promotion.validFrom)} - {formatDate(promotion.validUntil)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="space-y-1">
                        <div>Views: {promotion.analytics.views}</div>
                        <div>Clicks: {promotion.analytics.clicks}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPromotion(promotion);
                            setShowPromotionModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPromotion(promotion);
                            setShowPromotionModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => togglePromotionStatus(promotion._id)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {promotion.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deletePromotion(promotion._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Promotion Form Modal */}
      <PromotionFormModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        promotion={selectedPromotion}
        onSuccess={fetchPromotions}
      />
    </div>
  );
};

export default AdminPromotions;
