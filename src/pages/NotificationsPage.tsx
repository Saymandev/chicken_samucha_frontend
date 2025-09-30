import { Bell, Check, ChevronLeft, ChevronRight, Clock, Package } from 'lucide-react';
import React from 'react';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { useStore } from '../store/useStore';

const NotificationsPage: React.FC = () => {
  const { user, language } = useStore();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, currentPage, totalPages, goToPage } = useUserNotifications(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
          <h1 className={`text-3xl font-bold text-gray-900 dark:text-white ${
            language === 'bn' ? 'font-bengali' : ''
          }`}>
            {language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
                language === 'bn' ? 'font-bengali' : ''
              }`}
            >
              <Check className="w-4 h-4" />
              {language === 'bn' ? 'সব পড়া হয়েছে চিহ্নিত করুন' : 'Mark all as read'}
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-xl font-semibold text-gray-900 dark:text-white mb-2 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {language === 'bn' ? 'এখনও কোনো বিজ্ঞপ্তি নেই' : 'No notifications yet'}
              </h3>
              <p className={`text-gray-600 dark:text-gray-400 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {language === 'bn' 
                  ? 'আপনি এখানে অর্ডার আপডেট এবং গুরুত্বপূর্ণ বার্তা দেখতে পাবেন'
                  : "You'll see order updates and important messages here"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {notification.type === 'order' ? (
                        <Package className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Bell className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-medium ${
                          !notification.read 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    language === 'bn' ? 'font-bengali' : ''
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {language === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show first page, last page, current page, and pages around current
                  const showPage = 
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                  
                  // Show ellipsis
                  const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
                  const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <span key={i} className="px-2 text-gray-500 dark:text-gray-400">
                        ...
                      </span>
                    );
                  }

                  if (!showPage) return null;

                  return (
                    <button
                      key={i}
                      onClick={() => goToPage(pageNum)}
                      className={`min-w-[40px] px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Mobile page indicator */}
              <div className={`sm:hidden text-sm text-gray-700 dark:text-gray-300 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {language === 'bn' ? `পৃষ্ঠা ${currentPage} এর ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    language === 'bn' ? 'font-bengali' : ''
                  }`}
                >
                  {language === 'bn' ? 'পরবর্তী' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 