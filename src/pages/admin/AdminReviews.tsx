import { CheckCircle, Eye, MessageSquare, Search, Star, Trash2, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

// Debug: Log what adminAPI contains
console.log('AdminReviews - adminAPI object:', adminAPI);
console.log('AdminReviews - adminAPI.getAllReviews:', adminAPI.getAllReviews);

interface Review {
  _id: string;
  customer: { 
    name: string; 
    email?: string; 
    phone?: string;
    user?: { name: string; email: string; };
  };
  product?: { 
    _id: string;
    name: { en: string; bn: string; } | string; 
  };
  originalProductName?: string;
  rating: number;
  comment: { en: string; bn?: string; } | string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  adminResponse?: {
    message: { en: string; bn?: string; } | string;
    respondedBy?: string;
    respondedAt?: string;
  };
  createdAt: string;
  helpfulVotes: number;
  totalVotes: number;
  isFeatured: boolean;
  isVisible: boolean;
  images?: Array<{ url: string; public_id: string; }>;
  reviewType: string;
  tags?: string[];
}

const AdminReviews: React.FC = () => {
  console.log('AdminReviews component mounted');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    console.log('AdminReviews useEffect triggered');
    console.log('Dependencies:', { currentPage, searchTerm, statusFilter, ratingFilter });
    fetchReviews();
  }, [currentPage, searchTerm, statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      console.log('=== FRONTEND DEBUG ===');
      console.log('Calling adminAPI.getAllReviews with params:', {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        rating: ratingFilter !== 'all' ? ratingFilter : undefined
      });
      
      const params: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        rating: ratingFilter !== 'all' ? ratingFilter : undefined
      };

      console.log('About to call adminAPI.getAllReviews...');
      const response = await adminAPI.getAllReviews(params);
      console.log('Response received:', response.data);
      
      if (response.data.success) {
        setReviews(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected' | 'hidden') => {
    try {
      setActionLoading(reviewId);
      await adminAPI.updateReviewStatus(reviewId, { status });
      toast.success(`Review ${status} successfully`);
      fetchReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error(`Failed to ${status} review`);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFeatured = async (reviewId: string, isFeatured: boolean) => {
    try {
      setActionLoading(reviewId);
      await adminAPI.updateReviewStatus(reviewId, { isFeatured });
      toast.success(`Review ${isFeatured ? 'featured' : 'unfeatured'} successfully`);
      fetchReviews();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    } finally {
      setActionLoading(null);
    }
  };

  const submitAdminResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setActionLoading(reviewId);
      await adminAPI.addAdminResponse(reviewId, responseText);
      toast.success('Response added successfully');
      setRespondingTo(null);
      setResponseText('');
      fetchReviews();
    } catch (error) {
      console.error('Error adding admin response:', error);
      toast.error('Failed to add response');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    
    try {
      setActionLoading(reviewId);
      await adminAPI.deleteReview(reviewId);
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'hidden': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCommentText = (comment: { en: string; bn?: string; } | string) => {
    if (typeof comment === 'string') return comment;
    return comment.en || comment.bn || '';
  };

  const getProductName = (review: Review) => {
    if (review.product) {
      if (typeof review.product.name === 'string') return review.product.name;
      return review.product.name.en || review.product.name.bn || 'Unknown Product';
    }
    return review.originalProductName || 'General Review';
  };

  const getCustomerName = (customer: Review['customer']) => {
    return customer.user?.name || customer.name || 'Anonymous';
  };

  const getAdminResponseText = (adminResponse?: Review['adminResponse']) => {
    if (!adminResponse) return '';
    if (typeof adminResponse.message === 'string') return adminResponse.message;
    return adminResponse.message.en || adminResponse.message.bn || '';
  };

  if (loading && reviews.length === 0) {
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
              Review Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Moderate customer reviews and respond to feedback ({total} total reviews)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reviews, customers, products..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="hidden">Hidden</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {getCustomerName(review.customer)}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(review.status)}`}>
                      {review.status.toUpperCase()}
                    </span>
                    {review.isFeatured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Product: {getProductName(review)}
                  </p>
                  <div className="flex items-center gap-4 mb-3">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      👍 {review.helpfulVotes || 0} helpful
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">{getCommentText(review.comment)}</p>
              </div>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="mb-4">
                  <div className="flex gap-2 flex-wrap">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={`Review ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {review.adminResponse && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Admin Response:
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">{getAdminResponseText(review.adminResponse)}</p>
                  {review.adminResponse.respondedAt && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {new Date(review.adminResponse.respondedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {respondingTo === review._id && (
                <div className="mb-4">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => submitAdminResponse(review._id)}
                      disabled={actionLoading === review._id}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    >
                      {actionLoading === review._id ? 'Submitting...' : 'Submit Response'}
                    </button>
                    <button
                      onClick={() => {
                        setRespondingTo(null);
                        setResponseText('');
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                {review.product && (
                  <Link
                    to={`/products/${review.product._id}`}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Product
                  </Link>
                )}

                {!review.adminResponse && (
                  <button
                    onClick={() => setRespondingTo(review._id)}
                    disabled={actionLoading === review._id}
                    className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-purple-300"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Respond
                  </button>
                )}

                <button
                  onClick={() => toggleFeatured(review._id, !review.isFeatured)}
                  disabled={actionLoading === review._id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    review.isFeatured 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  {review.isFeatured ? 'Unfeature' : 'Feature'}
                </button>

                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateReviewStatus(review._id, 'approved')}
                      disabled={actionLoading === review._id}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => updateReviewStatus(review._id, 'rejected')}
                      disabled={actionLoading === review._id}
                      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}

                {review.status === 'approved' && (
                  <button
                    onClick={() => updateReviewStatus(review._id, 'hidden')}
                    disabled={actionLoading === review._id}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
                  >
                    <XCircle className="w-4 h-4" />
                    Hide
                  </button>
                )}

                <button
                  onClick={() => deleteReview(review._id)}
                  disabled={actionLoading === review._id}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

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

        {reviews.length === 0 && !loading && (
          <div className="text-center py-12">
            <Star className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No reviews found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Customer reviews will appear here when they start rating products'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
