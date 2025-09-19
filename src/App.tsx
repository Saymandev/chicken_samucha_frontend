import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
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
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
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
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';

// Admin Pages
import AdminCategories from './pages/admin/AdminCategories';
import AdminChat from './pages/admin/AdminChat';
import AdminContent from './pages/admin/AdminContent';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminReports from './pages/admin/AdminReports';
import AdminReviews from './pages/admin/AdminReviews';
import AdminUsers from './pages/admin/AdminUsers';

// Components
import FloatingChatButton from './components/common/FloatingChatButton';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import ShoppingCartSidebar from './components/common/ShoppingCartSidebar';

// Contexts
import { CartProvider, useCart } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

// Component to handle layout based on route
function AppContent() {
  const { theme } = useStore();
  const { isCartOpen, closeCart } = useCart();
  const location = useLocation();
  
  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

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
          
          {/* 404 Page */}
          <Route path="*" element={<div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
            <p className="text-gray-600 dark:text-gray-400">Page not found</p>
          </div>} />
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