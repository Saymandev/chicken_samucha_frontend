import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// Transform MongoDB _id to id for frontend consistency
const transformData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(transformData);
  }
  
  if (data && typeof data === 'object' && data._id) {
    const { _id, ...rest } = data;
    return {
      id: _id,
      ...rest,
      ...Object.keys(rest).reduce((acc, key) => {
        acc[key] = transformData(rest[key]);
        return acc;
      }, {} as any)
    };
  }
  
  return data;
};
// changes made here
const API_BASE_URL =  process.env.API_URL || 'https://chicken-samucha-backend.onrender.com/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Check if token is expired by decoding it (basic check)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          // Token is expired, remove it
          localStorage.removeItem('token');
        } else {
          // Token seems valid, add to headers
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        // Invalid token format, remove it
        localStorage.removeItem('token');
      }
    }
    
    // Don't set Content-Type for FormData - let browser handle it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and data transformation
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Transform _id to id for consistency
    if (response.data) {
      response.data = transformData(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data?.message || 'An error occurred. Please try again.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: any;
  }) => api.post('/auth/register', userData),
  
  getMe: () => api.get('/auth/me'),
  
  updateDetails: (data: any) => api.put('/auth/updatedetails', data),
  
  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.put('/auth/updatepassword', data),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.put(`/auth/reset-password/${token}`, { password }),
  
  uploadAvatar: (formData: FormData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  trackGuestOrder: (orderNumber: string, phone: string) =>
    api.post('/auth/track-order', { orderNumber, phone }),

  // User notifications
  getUserNotifications: (params?: any) => api.get('/users/notifications', { params }),
  markNotificationAsRead: (id: string) => api.put(`/users/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/users/notifications/mark-all-read'),
};

export const productsAPI = {
  getProducts: (params?: any) => api.get('/products', { params }),
  getFeaturedProducts: (limit?: number) =>
    api.get('/products/featured', { params: { limit } }),
  getProduct: (id: string) => api.get(`/products/${id}`),
};

export const ordersAPI = {
  createOrder: (orderData: FormData) =>
    api.post('/orders', orderData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getMyOrders: (params?: any) => api.get('/orders/my-orders', { params }),
  trackOrder: (orderNumber: string) => api.get(`/orders/track/${orderNumber}`),
  
  // Enhanced order tracking with phone verification
  trackOrderWithPhone: (orderNumber: string, phone: string) =>
    api.post('/orders/track', { orderNumber, phone }),
  
  // Request order return
  requestReturn: (orderNumber: string, reason: string, description?: string) =>
    api.post('/orders/return', { orderNumber, reason, description }),
};

export const reviewsAPI = {
  getReviews: (params?: any) => api.get('/reviews', { params }),
  getFeaturedReviews: (limit?: number) =>
    api.get('/reviews/featured', { params: { limit } }),
  
  getMyReviews: (params?: any) => api.get('/reviews/my-reviews', { params }),
  
  createReview: (reviewData: FormData) =>
    api.post('/reviews', reviewData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const contentAPI = {
  getHeroContent: () => api.get('/content/hero'),
  getSliderItems: () => api.get('/content/slider'),
  getPaymentSettings: () => api.get('/content/payment-settings'),
  createSliderItem: (itemData: FormData) => api.post('/content/slider', itemData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateSliderItem: (id: string, itemData: FormData) => api.put(`/content/slider/${id}`, itemData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteSliderItem: (id: string) => api.delete(`/content/slider/${id}`),
};

export const chatAPI = {
  startChatSession: (data: any) => api.post('/chat/session', data),
  getChatSession: (chatId: string) => api.get(`/chat/session/${chatId}`),
  getChatMessages: (chatId: string, params?: any) =>
    api.get(`/chat/${chatId}/messages`, { params }),
  
  sendMessage: (messageData: FormData) =>
    api.post('/chat/message', messageData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  updateChatSession: (chatId: string, data: any) =>
    api.put(`/chat/session/${chatId}`, data),
};

// Contact and Support APIs
export const contactAPI = {
  // Send contact form message
  sendContactMessage: (contactData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => api.post('/contact/message', contactData),
  
  // Subscribe to newsletter
  subscribeNewsletter: (email: string) =>
    api.post('/contact/newsletter', { email }),
  
  // Get FAQ items
  getFAQs: (params?: any) => api.get('/content/faq', { params }),
  
  // Search FAQs
  searchFAQs: (query: string) =>
    api.get('/content/faq/search', { params: { q: query } }),
};

// Support APIs
export const supportAPI = {
  // Get return policy
  getReturnPolicy: () => api.get('/content/return-policy'),
  
  // Get refund policy
  getRefundPolicy: () => api.get('/content/refund-policy'),
  
  // Get privacy policy
  getPrivacyPolicy: () => api.get('/content/privacy-policy'),
  
  // Get terms of service
  getTermsOfService: () => api.get('/content/terms-of-service'),
  
  // Get cookie policy
  getCookiePolicy: () => api.get('/content/cookie-policy'),
  
  // Request data export (GDPR)
  requestDataExport: () => api.post('/support/data-export'),
  
  // Request account deletion
  requestAccountDeletion: (reason?: string) =>
    api.post('/support/account-deletion', { reason }),
  
  // Save cookie preferences
  saveCookiePreferences: (preferences: any) =>
    api.post('/support/cookie-preferences', preferences),
};

// Notification APIs
export const notificationAPI = {
  // Subscribe to product/feature notifications
  subscribeToNotifications: (data: {
    type: 'feature' | 'product' | 'news';
    email: string;
    preferences?: any;
  }) => api.post('/notifications/subscribe', data),
  
  // Unsubscribe from notifications
  unsubscribe: (token: string) =>
    api.post('/notifications/unsubscribe', { token }),
};

// Admin APIs
export const adminAPI = {
  // Dashboard statistics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Product management
  getAllProducts: (params?: any) => api.get('/admin/products', { params }),
  createProduct: (productData: FormData) => {
    
    // Don't set Content-Type header - let browser set it with boundary
    return api.post('/admin/products', productData);
  },
  updateProduct: (id: string, productData: FormData) => {
    // Don't set Content-Type header - let browser set it with boundary  
    const headers: any = {};
    return api.put(`/admin/products/${id}`, productData, { headers });
  },
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  
  // Order management
  getAllOrders: (params?: any) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
  verifyPayment: (id: string) => api.put(`/admin/orders/${id}/verify-payment`),
  
  // User management
  getAllUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserStatus: (id: string, isActive: boolean) => api.put(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  // Review management
  getAllReviews: (params?: any) => {
    
    return api.get('/admin/reviews', { params });
  },
  getReview: (id: string) => api.get(`/admin/reviews/${id}`),
  updateReviewStatus: (id: string, data: { status?: string; isFeatured?: boolean }) => 
    api.put(`/admin/reviews/${id}/status`, data),
  addAdminResponse: (id: string, response: string) => 
    api.put(`/admin/reviews/${id}/response`, { response }),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
  approveReview: (id: string) => api.put(`/admin/reviews/${id}/status`, { status: 'approved' }),
  rejectReview: (id: string) => api.put(`/admin/reviews/${id}/status`, { status: 'rejected' }),
  
  // Content management
  getHeroContent: () => api.get('/admin/content/hero'),
  updateHeroContent: (content: any) => api.put('/admin/content/hero', content),
  
  getSliderItems: () => api.get('/admin/content/slider'),
  createSliderItem: (itemData: FormData) => api.post('/content/slider', itemData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateSliderItem: (id: string, itemData: any) => api.put(`/admin/content/slider/${id}`, itemData),
  deleteSliderItem: (id: string) => api.delete(`/admin/content/slider/${id}`),
  toggleSliderItem: (id: string) => api.put(`/admin/content/slider/${id}/toggle`),
  
  // Bangladesh payment settings
  getPaymentSettings: () => api.get('/admin/settings/payments'),
  updatePaymentSettings: (settings: any) => api.put('/admin/settings/payments', settings),
  
  // Chat management  
  getChatSessions: (params?: any) => api.get('/chat/sessions', { params }),
  getChatMessages: (chatId: string) => api.get(`/chat/${chatId}/messages`),
  sendAdminMessage: (chatId: string, message: string) => api.post('/chat/admin/message', { chatId, message }),
  assignChatSession: (chatId: string, adminId: string) => api.put(`/chat/admin/session/${chatId}/assign`, { adminId }),
  closeChatSession: (chatId: string) => api.put(`/chat/session/${chatId}/end`),
  
  // Notifications
  getNotifications: (params?: any) => api.get('/admin/notifications', { params }),
  markNotificationAsRead: (id: string) => api.put(`/admin/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/admin/notifications/mark-all-read'),
  
  // Analytics
  getRevenueStats: (period: string) => api.get(`/admin/analytics/revenue?period=${period}`),
  getOrderStats: (period: string) => api.get(`/admin/analytics/orders?period=${period}`),
  getUserStats: (period: string) => api.get(`/admin/analytics/users?period=${period}`),
  getProductPerformance: () => api.get('/admin/analytics/products')
};

// Bangladesh Mobile Payment API
export const bdPaymentAPI = {
  // bKash
  initiateBkashPayment: (data: any) => api.post('/payments/bkash/initiate', data),
  verifyBkashPayment: (paymentId: string) => api.post(`/payments/bkash/verify/${paymentId}`),
  
  // Nagad
  initiateNagadPayment: (data: any) => api.post('/payments/nagad/initiate', data),
  verifyNagadPayment: (paymentId: string) => api.post(`/payments/nagad/verify/${paymentId}`),
  
  // Rocket
  initiateRocketPayment: (data: any) => api.post('/payments/rocket/initiate', data),
  verifyRocketPayment: (paymentId: string) => api.post(`/payments/rocket/verify/${paymentId}`),
  
  // Upay
  initiateUpayPayment: (data: any) => api.post('/payments/upay/initiate', data),
  verifyUpayPayment: (paymentId: string) => api.post(`/payments/upay/verify/${paymentId}`),
  
  // General payment verification
  verifyMobilePayment: (data: { method: string; transactionId: string; screenshot?: File }) => {
    const formData = new FormData();
    formData.append('method', data.method);
    formData.append('transactionId', data.transactionId);
    if (data.screenshot) {
      formData.append('screenshot', data.screenshot);
    }
    return api.post('/payments/mobile/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;