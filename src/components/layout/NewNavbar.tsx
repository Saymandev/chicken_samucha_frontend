import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Globe,
  Home,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  ShoppingCart,
  Sun,
  User,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../store/useStore';
import { categoriesAPI } from '../../utils/api';
import { Skeleton } from '../common/Skeleton';
import UserNotificationDropdown from '../UserNotificationDropdown';

interface Category {
  _id: string;
  name: {
    en: string;
    bn: string;
  };
  slug: string;
  icon: string;
  color: string;
  productCount: number;
}

const NewNavbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    isAuthenticated, 
    user, 
    cartCount,
    theme, 
    language,
    toggleTheme, 
    setLanguage, 
    logout 
  } = useStore();
  const { openCart } = useCart();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoriesAPI.getNavbarCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const navItems = [
    {
      path: '/',
      label: t('nav.home'),
      icon: <Home className="w-4 h-4" />,
      active: location.pathname === '/'
    },
    {
      path: '/products?filter=offers',
      label: 'Offer Zone',
      icon: null,
      active: location.search.includes('filter=offers')
    },
    {
      path: '/products?filter=best-seller',
      label: 'Best Sellers',
      icon: null,
      active: location.search.includes('filter=best-seller')
    },
    {
      path: '/products',
      label: 'All Products',
      icon: null,
      active: location.pathname.startsWith('/products') && !location.search.includes('filter=')
    },
    {
      path: '#',
      label: 'Categories',
      icon: <Package className="w-4 h-4" />,
      active: false,
      hasDropdown: true
    }
  ];

  // Product quick links are now top-level nav items; no dropdown items needed

  const userMenuItems = [
    ...(user?.role === 'admin' ? [
      {
        path: '/admin',
        label: t('nav.adminDashboard'),
        icon: <Settings className="w-4 h-4" />
      }
    ] : []),
    {
      path: '/profile',
      label: t('nav.profile'),
      icon: <User className="w-4 h-4" />
    },
    {
      path: '/orders',
      label: t('nav.orders'),
      icon: <Package className="w-4 h-4" />
    }
  ];

  const handleLogout = async () => {
    try {
      logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/');
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as "en" | "bn");
    i18n.changeLanguage(lang);
  };

  if (isLoading) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Skeleton className="h-8 w-32" />
            <div className="hidden md:flex space-x-8">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {language === 'bn' ? 'চিকেন সমুচা' : 'Chicken Samosa'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 min-w-0 items-center justify-center md:space-x-6 lg:space-x-8 overflow-x-auto lg:overflow-visible flex-nowrap pr-2">
            {navItems.map((item) => (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setIsProductsMenuOpen(true)}
                onMouseLeave={() => item.hasDropdown && setIsProductsMenuOpen(false)}
              >
                {item.hasDropdown ? (
                  <div
                    className="flex items-center space-x-1 cursor-pointer text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={() => setIsProductsMenuOpen((prev) => !prev)}
                  >
                    {item.icon}
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-1 transition-colors ${
                      item.active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  </Link>
                )}

                {/* Products Dropdown */}
                {item.hasDropdown && (
                  <AnimatePresence>
                    {isProductsMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                      >
                        {/* Categories */}
                        <div className="px-4 py-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Categories
                          </h3>
                          {loadingCategories ? (
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center space-x-3">
                                  <Skeleton className="w-6 h-6 rounded" />
                                  <Skeleton className="h-4 w-20" />
                                </div>
                              ))}
                            </div>
                          ) : categories.length > 0 ? (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {categories.map((category) => (
                                <Link
                                  key={category._id}
                                  to={`/products?category=${category.slug}`}
                                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <div 
                                    className="w-6 h-6 rounded flex items-center justify-center text-sm"
                                    style={{ backgroundColor: category.color + '20' }}
                                  >
                                    {category.icon}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                      {category.name[language]}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {category.productCount} products
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                              No categories available
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 shrink-0">
            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            {isAuthenticated && <UserNotificationDropdown />}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                    >
                      {/* Quick Settings inside user dropdown */}
                      <button
                        onClick={() => handleLanguageChange(language === 'en' ? 'bn' : 'en')}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>Language</span>
                        </div>
                        <span className="text-xs opacity-80">{language.toUpperCase()}</span>
                      </button>
                      <button
                        onClick={toggleTheme}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {theme === 'light' ? (
                            <Moon className="w-4 h-4" />
                          ) : (
                            <Sun className="w-4 h-4" />
                          )}
                          <span>Theme</span>
                        </div>
                        <span className="text-xs opacity-80">{theme === 'light' ? 'Light' : 'Dark'}</span>
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />

                      {userMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      ))}
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-700"
            >
              <div className="px-4 py-4 space-y-4">
                {/* Top-level links: Home, Offer Zone, Best Sellers, All Products */}
                {navItems.filter(i => !i.hasDropdown).map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 transition-colors ${
                      item.active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}

                {/* Categories list */}
                <div>
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 font-medium mb-2">
                    <Package className="w-4 h-4" />
                    <span>Categories</span>
                  </div>
                  <div className="ml-6 space-y-2">
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        to={`/products?category=${category.slug}`}
                        className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {category.name[language]} ({category.productCount})
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default NewNavbar;
