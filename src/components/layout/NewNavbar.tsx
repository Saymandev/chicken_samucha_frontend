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

  // Product quick links are now top-level nav items; no dropdown items needed
  const renderCategoryTree = (node: Category, depth: number, onClick?: () => void) => {
    const indent = depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : '';
    return (
      <div key={node.id} className="">
        <Link
          to={`/products?category=${node.slug}`}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${indent}`}
          onClick={onClick}
        >
          {depth === 0 ? (
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-sm"
              style={{ backgroundColor: node.color + '20' }}
            >
              {node.icon}
            </div>
          ) : (
            <span className="text-gray-400">•</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {node.name[language] || node.name.en}
            </div>
            {depth === 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {node.productCount} products
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">{node.productCount}</span>
        </Link>
        {node.children && node.children.length > 0 && (
          <div className="ml-4 space-y-1">
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
      {/* Top Header Bar */}
      <div className="bg-orange-600 text-white py-2 text-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Left Side - Contact Info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@chickensamosa.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Hotline: 01879 222 444</span>
              </div>
            </div>
            
            {/* Right Side - Social Links */}
            <div className="flex items-center space-x-4">
              <Link to="/contact" className="hover:text-orange-200 transition-colors">
                Contact Us
              </Link>
              <div className="flex items-center space-x-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-200 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-orange-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold">chickensamosa.com</div>
                <div className="text-xs opacity-90">PROUDLY BANGLADESHI</div>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search entire store here..."
                  className="w-full px-4 py-3 pr-12 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Side - Cart and User */}
            <div className="flex items-center space-x-6">
              {/* Cart */}
              <button
                onClick={openCart}
                className="flex items-center space-x-2 hover:text-orange-200 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">My Cart</span>
              </button>

              {/* User Section */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm">Hello {user?.name?.split(' ')[0]}!</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm">Hello Guest! <Link to="/login" className="underline hover:text-blue-200">Login</Link> / <Link to="/register" className="underline hover:text-blue-200">Register</Link></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            {/* Category Sidebar */}
            <div className="relative">
              <button
                onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
                <span className="font-semibold">ALL CATEGORIES</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Categories Dropdown */}
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
                        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                          {categories.map((category) => renderCategoryTree(category, 0))}
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
            </div>

            {/* Main Navigation Links */}
            <div className="flex-1 flex items-center justify-center space-x-8 ml-8">
              {menuLoading ? (
                // Loading skeleton for menu items
                <div className="flex space-x-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-6 w-20" />
                  ))}
                </div>
              ) : (
                menuItems.map((item) => (
                  <div key={item.id} className="relative">
                    {item.isExternal ? (
                      <a
                        href={item.path}
                        target={item.target}
                        rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                        className={`flex items-center space-x-2 px-3 py-2 transition-colors ${
                          isMenuItemActive(item)
                            ? 'text-orange-600 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium'
                        } ${item.cssClass || ''}`}
                      >
                        <span className="whitespace-nowrap">
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
                      </a>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-2 px-3 py-2 transition-colors ${
                          isMenuItemActive(item)
                            ? 'text-orange-600 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium'
                        } ${item.cssClass || ''}`}
                      >
                        <span className="whitespace-nowrap">
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
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Right Side - Additional Actions */}
            <div className="flex items-center space-x-4 ml-8">
              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

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
                      {user?.avatar?.url ? (
                        <img
                          src={user?.avatar?.url}
                          alt={user?.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
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
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
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
              <div className="px-4 py-4 space-y-4">
                {/* Dynamic navigation menu items */}
                {menuItems.map((item) => (
                  <div key={item.id}>
                    {item.isExternal ? (
                      <a
                        href={item.path}
                        target={item.target}
                        rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                        className={`flex items-center space-x-2 transition-colors ${
                          isMenuItemActive(item)
                            ? 'text-orange-600 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium'
                        } ${item.cssClass || ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="font-medium">
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
                      </a>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-2 transition-colors ${
                          isMenuItemActive(item)
                            ? 'text-orange-600 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium'
                        } ${item.cssClass || ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="font-medium">
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
                      </Link>
                    )}
                  </div>
                ))}

                {/* Categories list */}
                <div>
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 font-medium mb-2">
                    <Package className="w-4 h-4" />
                    <span>Categories</span>
                  </div>
                  <div className="ml-6 space-y-3">
                    {categories.map((category) => renderCategoryTree(category, 0, () => setIsMobileMenuOpen(false)))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close menus */}
      {(isMobileMenuOpen || isUserMenuOpen || isProductsMenuOpen) && (
        <div
          className="fixed inset-0 z-40 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
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
