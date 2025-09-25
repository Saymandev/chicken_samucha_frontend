import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Facebook,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  LogOut,
  Mail,
  Menu,
  Moon,
  Package,
  Phone,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Twitter,
  User,
  X,
  Youtube
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNavigationMenu } from '../../hooks/useNavigationMenu';
import { useStore } from '../../store/useStore';
import { categoriesAPI } from '../../utils/api';
import PickplaceLogo from '../common/PickplaceLogo';
import { Skeleton } from '../common/Skeleton';
import UserNotificationDropdown from '../UserNotificationDropdown';

interface Category {
  id: string;
  name: {
    en: string;
    bn: string;
  };
  slug: string;
  icon: string;
  color: string;
  productCount: number;
  parentCategory?: { id: string } | null;
  children?: Category[];
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
  const { wishlistCount } = useWishlist();
  const { menuItems, loading: menuLoading } = useNavigationMenu();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debug menu items
  useEffect(() => {
    console.log('Menu items updated:', menuItems);
  }, [menuItems]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      // Fetch full list and build a reliable tree
      const response = await categoriesAPI.getAllCategories({ withProductCount: true });
      if (response.data.success) {
        const flat: any[] = response.data.data || [];
        const idToNode = new Map<string, Category>();
        flat.forEach((raw: any) => {
          const id = raw.id || raw._id;
          idToNode.set(id, {
            id,
            name: raw.name,
            slug: raw.slug,
            icon: raw.icon,
            color: raw.color,
            productCount: raw.productCount || 0,
            parentCategory: raw.parentCategory ? { id: raw.parentCategory.id || raw.parentCategory._id } : null,
            children: []
          });
        });

        const roots: Category[] = [];
        flat.forEach((raw: any) => {
          const id = raw.id || raw._id;
          const parentId = raw.parentCategory ? (raw.parentCategory.id || raw.parentCategory._id) : undefined;
          const node = idToNode.get(id)!;
          // Guard against self-parented records
          if (parentId && parentId !== id && idToNode.has(parentId)) {
            idToNode.get(parentId)!.children!.push(node);
          } else {
            roots.push(node);
          }
        });

        setCategories(roots);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Helper function to check if a menu item is active
  const isMenuItemActive = (item: any) => {
    if (item.path === '/' && location.pathname === '/') return true;
    if (item.path !== '/' && location.pathname.startsWith(item.path)) return true;
    if (item.path.includes('?') && location.search.includes(item.path.split('?')[1])) return true;
    return false;
  };

  // Handle search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle menu item click with filtering
  const handleMenuClick = (item: any) => {
    console.log('Menu clicked:', item); // Debug log
    if (item.isExternal) {
      window.open(item.path, item.target);
    } else {
      console.log('Navigating to:', item.path); // Debug log
      navigate(item.path);
    }
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  // Product quick links are now top-level nav items; no dropdown items needed
  const renderCategoryTree = (node: Category, depth: number, onClick?: () => void) => {
    const indent = depth > 0 ? `ml-${Math.min(depth * 2, 6)} sm:ml-${Math.min(depth * 4, 12)}` : '';
    return (
      <div key={node.id} className="">
        <Link
          to={`/products?category=${node.slug}`}
          className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${indent}`}
          onClick={onClick}
        >
          {depth === 0 ? (
            <div 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-xs sm:text-sm"
              style={{ backgroundColor: node.color + '20' }}
            >
              {node.icon}
            </div>
          ) : (
            <span className="text-gray-400 text-xs sm:text-sm">•</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">
              {node.name[language] || node.name.en}
            </div>
            {depth === 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {node.productCount} products
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">{node.productCount}</span>
        </Link>
        {node.children && node.children.length > 0 && (
          <div className="ml-2 sm:ml-4 space-y-1">
            {node.children.map(child => renderCategoryTree(child, depth + 1, onClick))}
          </div>
        )}
      </div>
    );
  };

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
        <div className="container mx-auto px-4">
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
    <>
      {/* Top Header Bar - Hidden on mobile and tablet */}
      <div className="hidden md:block bg-orange-600 text-white py-2 text-xs sm:text-sm">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            {/* Left Side - Contact Info */}
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">support@pickplace.com.bd</span>
                <span className="xs:hidden">support@pickplace.com.bd</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Hotline: 01879 222 444</span>
                <span className="sm:hidden">01879 222 444</span>
              </div>
            </div>
            
            {/* Right Side - Social Links */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/contact" className="hover:text-orange-200 transition-colors text-xs sm:text-sm">
                <span className="hidden sm:inline">Contact Us</span>
                <span className="sm:hidden">Contact</span>
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors p-1">
                  <Facebook className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors p-1">
                  <Youtube className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors p-1">
                  <Twitter className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors p-1">
                  <Instagram className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors p-1">
                  <Linkedin className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-orange-600 text-white py-3 sm:py-4">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-0 lg:space-y-0 md:space-y-3">
            {/* Logo - Hidden on mobile and tablet */}
            <Link to="/" className="hidden md:flex items-center">
              <PickplaceLogo size="md" />
            </Link>

            {/* Search Bar */}
            <div className="w-full lg:flex-1 lg:max-w-2xl lg:mx-8 order-3 lg:order-2 min-w-0">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search entire store here..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
                />
                <button 
                  type="submit"
                  className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-1.5 sm:p-2 rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>
                  </div>

            {/* Right Side - User Only */}
            <div className="flex items-center space-x-3 sm:space-x-6 order-2 lg:order-3">
              {/* User Section */}
              {isAuthenticated ? (
                ''
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center min-h-12 sm:min-h-16 py-2 justify-between">
            {/* Category Sidebar */}
            <div className="relative">
              <button
                onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)}
                className="flex items-center space-x-1 sm:space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-3 sm:py-3 rounded-lg transition-colors text-xs sm:text-sm min-h-[44px] touch-manipulation"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold hidden sm:inline">ALL CATEGORIES</span>
                <span className="font-semibold sm:hidden">CATEGORIES</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>

              {/* Categories Dropdown */}
                  <AnimatePresence>
                    {isProductsMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 sm:w-72 md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-96 overflow-y-auto"
                      >
                        {/* Categories */}
                        <div className="px-3 sm:px-4 py-2">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Categories
                          </h3>
                          {loadingCategories ? (
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center space-x-2 sm:space-x-3">
                                  <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded" />
                                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                                </div>
                              ))}
                            </div>
                          ) : categories.length > 0 ? (
                            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                              {categories.map((category) => renderCategoryTree(category, 0))}
                            </div>
                          ) : (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-2">
                              No categories available
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

            {/* Main Navigation Links */}
            <div className="flex-1 hidden lg:flex items-center justify-center ml-2 xl:ml-4 2xl:ml-8 min-w-0">
              {menuLoading ? (
                // Loading skeleton for menu items
                <div className="flex flex-wrap justify-center gap-2 xl:gap-4 2xl:gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-6 w-12 xl:w-16 2xl:w-20" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-4 xl:gap-6 2xl:gap-8">
                  {menuItems.map((item) => (
                    <div key={item.id} className="relative">
                      {/* Small pill badge centered above item */}
                      {item.badge && (
                        <div
                          className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0.5 rounded-full text-white shadow ${
                            item.badge.color === 'orange'
                              ? 'bg-orange-500'
                              : item.badge.color === 'green'
                              ? 'bg-green-500'
                              : item.badge.color === 'blue'
                              ? 'bg-blue-500'
                              : item.badge.color === 'purple'
                              ? 'bg-purple-500'
                              : 'bg-red-500'
                          }`}
                        >
                          {item.badge.text}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleMenuClick(item)}
                        className={`px-2 2xl:px-3 py-2 transition-colors text-sm xl:text-base leading-none ${
                          isMenuItemActive(item)
                            ? 'text-orange-600 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium'
                        } ${item.cssClass || ''}`}
                      >
                        <span className="whitespace-nowrap">
                          {language === 'bn' ? item.title.bn : item.title.en}
                        </span>
                      </button>
              </div>
            ))}
          </div>
              )}
            </div>

            {/* Right Side - Additional Actions */}
            <div className="flex items-center space-x-2">
            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {isAuthenticated && <UserNotificationDropdown />}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                    <button type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1 sm:space-x-2 p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  {user?.avatar?.url ? (
                    <img
                      src={user?.avatar?.url}
                      alt={user?.name}
                      className="w-5 h-5 sm:w-7 sm:h-7 rounded-full object-cover"
                    />
                  ) : (
                      <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  )}
                  </div>
                  <span className="hidden xl:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Register
              </Link>
            </div>
            )}

              {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
            >
              {isMobileMenuOpen ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu (below lg) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700"
            >
              <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
                {/* Mobile Header with Logo and Cart/Wishlist */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  {/* Mobile Logo */}
                  <Link
                    to="/" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PickplaceLogo size="sm" />
                  </Link>

                  {/* Mobile primary actions intentionally hidden per requirements */}
                  <div className="hidden" />
                  </div>

                {/* Dynamic navigation menu items */}
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <div key={item.id}>
                      <button type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleMenuClick(item)}
                        className={`flex items-center justify-between w-full space-x-2 transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isMenuItemActive(item)
                            ? 'text-orange-600 font-semibold bg-orange-50 dark:bg-orange-900/20'
                            : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium'
                        } ${item.cssClass || ''}`}
                      >
                        <span className="font-medium text-sm sm:text-base">
                          {language === 'bn' ? item.title.bn : item.title.en}
                        </span>
                        {item.badge && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.badge.color === 'orange' 
                              ? 'bg-orange-100 text-orange-600' 
                              : item.badge.color === 'green'
                              ? 'bg-green-100 text-green-600'
                              : item.badge.color === 'blue'
                              ? 'bg-blue-100 text-blue-600'
                              : item.badge.color === 'purple'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-red-100 text-red-500'
                          }`}>
                            {item.badge.text}
                          </span>
                        )}
                      </button>
                  </div>
                  ))}
                </div>

                {/* Categories list hidden on mobile panel as requested */}
                <div className="hidden" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close menus */}
      {(isMobileMenuOpen || isUserMenuOpen || isProductsMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsUserMenuOpen(false);
            setIsProductsMenuOpen(false);
          }}
        />
      )}
    </nav>
    </>
  );
};

export default NewNavbar;