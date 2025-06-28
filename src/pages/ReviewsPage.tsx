import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Search, Star, ThumbsUp, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { reviewsAPI } from '../utils/api';

interface Review {
  _id: string;
  user: {
    name: string;
    avatar?: string;
  };
  customer: {
    name: string;
    email?: string;
  };
  product?: {
    _id: string;
    name: { en: string; bn?: string; } | string;
  };
  originalProductName?: string;
  rating: number;
  comment: { en: string; bn?: string; } | string;
  isVerified: boolean;
  helpfulVotes: number;
  createdAt: string;
  adminResponse?: {
    message: { en: string; bn?: string; } | string;
    respondedAt: string;
  };
}

const ReviewsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Review writing modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    productName: '',
    rating: 0,
    comment: '',
    orderNumber: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch reviews
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        rating: filterRating || undefined,
        sortBy: sortBy
      };

      const response = await reviewsAPI.getReviews(params);
      const { data, totalPages: pages } = response.data;
      
      setReviews(data || []);
      setTotalPages(pages || 1);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      // Don't show error toast for empty reviews, just show empty state
      if (error.response?.status !== 404) {
        toast.error('Failed to load reviews');
      }
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, searchTerm, filterRating, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReviews();
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      return;
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewForm.productName || !reviewForm.rating || !reviewForm.comment) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      
      // Create proper nested objects for validation
      const reviewData = {
        customer: {
          name: user?.name || 'Anonymous Customer',
          email: user?.email || '',
        },
        product: reviewForm.productName, // This should be a product ID in real implementation
        rating: reviewForm.rating,
        comment: {
          en: reviewForm.comment
        }
      };
      
      // Send as JSON in the body - but FormData expects individual fields
      // Let's send the nested fields properly
      formData.append('customer.name', reviewData.customer.name);
      if (reviewData.customer.email) {
        formData.append('customer.email', reviewData.customer.email);
      }
      formData.append('product', reviewData.product);
      formData.append('rating', reviewData.rating.toString());
      formData.append('comment.en', reviewData.comment.en);
      
      // Add order number if provided
      if (reviewForm.orderNumber) {
        formData.append('orderNumber', reviewForm.orderNumber);
      }

      console.log('Submitting review with FormData:');
      // Log FormData contents (TypeScript-safe way)
      const formDataEntries: string[] = [];
      formData.forEach((value, key) => {
        formDataEntries.push(`${key}: ${value}`);
      });
      console.log(formDataEntries.join('\n'));

      const response = await reviewsAPI.createReview(formData);
      
      if (response.data.success) {
        toast.success('Review submitted successfully!');
        setShowReviewModal(false);
        setReviewForm({ productName: '', rating: 0, comment: '', orderNumber: '' });
        fetchReviews(); // Refresh reviews
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md', interactive = false, onStarClick?: (rating: number) => void) => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-500 transition-colors' : ''}`}
            onClick={() => interactive && onStarClick && onStarClick(star)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const getCustomerName = (review: Review) => {
    return review.user?.name || review.customer?.name || 'Anonymous';
  };

  const getAdminResponseText = (adminResponse?: Review['adminResponse']) => {
    if (!adminResponse) return '';
    if (typeof adminResponse.message === 'string') return adminResponse.message;
    return adminResponse.message.en || adminResponse.message.bn || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
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
              className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Star className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              Customer Reviews
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See what our customers say about our delicious chicken samosas
            </p>
          </div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </form>

              {/* Rating Filter */}
              <select
                value={filterRating || ''}
                onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>

              {/* Write Review Button */}
              <button 
                onClick={handleWriteReview}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Write Review
              </button>
            </div>
          </motion.div>

          {/* Reviews List */}
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Be the first to share your experience with our delicious chicken samosas!
              </p>
              <button 
                onClick={handleWriteReview}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300"
              >
                Write First Review
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {review.user?.avatar ? (
                        <img
                          src={review.user.avatar}
                          alt={getCustomerName(review)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1">
                      {/* User Info and Rating */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white flex items-center">
                            {getCustomerName(review)}
                            {review.isVerified && (
                              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Verified
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getProductName(review)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Review Content */}
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {getCommentText(review.comment)}
                      </p>

                      {/* Admin Response */}
                      {review.adminResponse && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-semibold text-blue-800 dark:text-blue-200">
                              Admin Response
                            </span>
                            <span className="ml-auto text-xs text-blue-600 dark:text-blue-400">
                              {formatDate(review.adminResponse.respondedAt)}
                            </span>
                          </div>
                          <p className="text-blue-700 dark:text-blue-300">
                            {getAdminResponseText(review.adminResponse)}
                          </p>
                        </div>
                      )}

                      {/* Helpful Actions */}
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-yellow-600 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">Helpful ({review.helpfulVotes || 0})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mt-8"
            >
              <div className="flex space-x-2">
                {currentPage > 1 && (
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                )}
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pageNum === currentPage
                          ? 'bg-yellow-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {currentPage < totalPages && (
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Write Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Write a Review
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={reviewForm.productName}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, productName: e.target.value }))}
                    placeholder="Which product are you reviewing?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating *
                  </label>
                  <div className="flex items-center space-x-2">
                    {renderStars(reviewForm.rating, 'md', true, (rating) => setReviewForm(prev => ({ ...prev, rating })))}
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      {reviewForm.rating > 0 ? `${reviewForm.rating} star${reviewForm.rating > 1 ? 's' : ''}` : 'Click to rate'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewForm.orderNumber}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                    placeholder="Your order number for verification"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage; 