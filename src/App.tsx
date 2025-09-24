import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import './index.css';
import { useStore } from './store/useStore';

// Layout Components
import AdminLayout from './components/layout/AdminLayout';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/NewNavbar';

// Main Pages
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';

// Feature Pages
import ChatPage from './pages/ChatPage';
import ContactUsPage from './pages/ContactUsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import FAQPage from './pages/FAQPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundHistoryPage from './pages/RefundHistoryPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ReturnPolicyPage from './pages/ReturnPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import TrackOrderPage from './pages/TrackOrderPage';

// User Pages
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import NotificationsPage from './pages/NotificationsPage';
import OrdersPage from './pages/OrdersPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PaymentFailPage from './pages/PaymentFailPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';

// Admin Pages
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminCategories from './pages/admin/AdminCategories';
import AdminChat from './pages/admin/AdminChat';
import AdminContent from './pages/admin/AdminContent';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminRefunds from './pages/admin/AdminRefunds';
import AdminReports from './pages/admin/AdminReports';
import AdminReviews from './pages/admin/AdminReviews';
import AdminSubscribers from './pages/admin/AdminSubscribers';
import AdminUsers from './pages/admin/AdminUsers';
import NavigationMenuPage from './pages/admin/NavigationMenuPage';

// Components
import FloatingChatButton from './components/common/FloatingChatButton';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import ShoppingCartSidebar from './components/common/ShoppingCartSidebar';
import PromotionModal from './components/promotion/PromotionModal';

// Contexts
import { CartProvider, useCart } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

// Hooks
import { usePromotions } from './hooks/usePromotions';

// Component to handle layout based on route
function AppContent() {
  const { theme, user } = useStore();
  const { isCartOpen, closeCart } = useCart();
  const location = useLocation();
  
  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Promotion modal logic (only for non-admin routes)
  const { currentPromotion, closePromotion, handlePromotionClick } = usePromotions();
  

  // Socket connection for real-time notifications
  useEffect(() => {
    let socket: Socket | null = null;

    if (user?.id) {
      const API_BASE_URL = process.env.API_URL || 'https://chicken-samucha-backend.onrender.com/api';
      const socketURL = API_BASE_URL.replace('/api', '');
      
      socket = io(socketURL, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        
        // Join user-specific room for notifications
        socket?.emit('join-user-room', user.id);
      });

      socket.on('new-user-notification', (notification) => {
        
        // You can add toast notification here if needed
      });

      socket.on('disconnect', () => {
        
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Only show Navbar for non-admin routes */}
      {!isAdminRoute && <Navbar />}
      
      <main className={isAdminRoute ? '' : 'min-h-screen'}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/chat" element={<ChatPage />} />
          
          {/* Payment Result Pages */}
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/fail" element={<PaymentFailPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Legal & Info Pages */}
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          
          {/* Protected User Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/refunds"
            element={
              <ProtectedRoute>
                <RefundHistoryPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminProducts />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminOrders />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminReviews />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminContent />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminCoupons />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/promotions"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminPromotions />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminRefunds />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminCategories />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chat"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminChat />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminReports />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscribers"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminSubscribers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/campaigns"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <AdminCampaigns />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/navigation"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout>
                  <NavigationMenuPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      
      {/* Only show Footer for non-admin routes */}
      {!isAdminRoute && <Footer />}
      
      {/* Shopping Cart Sidebar - Only show for non-admin routes */}
      {!isAdminRoute && (
        <ShoppingCartSidebar
          isOpen={isCartOpen}
          onClose={closeCart}
        />
      )}

      {/* Floating Chat Button - Only show for non-admin routes */}
      {!isAdminRoute && <FloatingChatButton />}
      
      {/* Promotion Modal - Only show for non-admin routes */}
      {!isAdminRoute && currentPromotion && (
        <PromotionModal
          promotion={currentPromotion}
          onClose={closePromotion}
          onTrackClick={handlePromotionClick}
        />
      )}
      
      {/* Global Loading Spinner */}
      <LoadingSpinner />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#374151' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
          },
        }}
      />
    </div>
  );
}

function App() {
  const { theme } = useStore();

  // Apply theme to document
  useEffect(() => {
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
     
    } else {
      document.documentElement.classList.remove('dark');
     
    }
  }, [theme]);

  // No need to override theme on refresh - user can manually toggle theme
  // Theme preference is already set during login in the store

  return (
    <Router>
      <CartProvider>
        <WishlistProvider>
          <AppContent />
        </WishlistProvider>
      </CartProvider>
    </Router>
  );
}

export default App; 