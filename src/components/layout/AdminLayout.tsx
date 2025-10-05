import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Navigation,
  Package,
  RefreshCw,
  Settings,
  ShoppingBag,
  Star,
  Sun,
  TicketPercent,
  Users,
  X,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import NotificationDropdown from '../NotificationDropdown';
import PickplaceLogo from '../common/PickplaceLogo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number;
  children?: NavItem[];
  isGroup?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, theme, setTheme, language, setLanguage, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['core']));

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/admin'
    },
    {
      id: 'core',
      label: 'Core Management',
      icon: <Package className="w-5 h-5" />,
      isGroup: true,
      children: [
        {
          id: 'products',
          label: 'Products',
          icon: <Package className="w-4 h-4" />,
          path: '/admin/products'
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: <Package className="w-4 h-4" />,
          path: '/admin/categories'
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: <ShoppingBag className="w-4 h-4" />,
          path: '/admin/orders'
        },
        {
          id: 'refunds',
          label: 'Refunds',
          icon: <RefreshCw className="w-4 h-4" />,
          path: '/admin/refunds'
        }
      ]
    },
    {
      id: 'users',
      label: 'Users & Reviews',
      icon: <Users className="w-5 h-5" />,
      isGroup: true,
      children: [
        {
          id: 'users',
          label: 'Users',
          icon: <Users className="w-4 h-4" />,
          path: '/admin/users'
        },
        {
          id: 'reviews',
          label: 'Reviews',
          icon: <Star className="w-4 h-4" />,
          path: '/admin/reviews'
        },
        {
          id: 'subscribers',
          label: 'Subscribers',
          icon: <Users className="w-4 h-4" />,
          path: '/admin/subscribers'
        }
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <Zap className="w-5 h-5" />,
      isGroup: true,
      children: [
        {
          id: 'coupons',
          label: 'Coupons',
          icon: <TicketPercent className="w-4 h-4" />,
          path: '/admin/coupons'
        },
        {
          id: 'flash-sales',
          label: 'Flash Sales',
          icon: <Zap className="w-4 h-4" />,
          path: '/admin/flash-sales'
        },
        {
          id: 'promotions',
          label: 'Promotions',
          icon: <Star className="w-4 h-4" />,
          path: '/admin/promotions'
        },
        {
          id: 'campaigns',
          label: 'Campaigns',
          icon: <FileText className="w-4 h-4" />,
          path: '/admin/campaigns'
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      isGroup: true,
      children: [
        {
          id: 'payment-settings',
          label: 'Payment Settings',
          icon: <CreditCard className="w-4 h-4" />,
          path: '/admin/payment-settings'
        },
        {
          id: 'content',
          label: 'Content',
          icon: <FileText className="w-4 h-4" />,
          path: '/admin/content'
        },
        {
          id: 'navigation',
          label: 'Navigation Menu',
          icon: <Navigation className="w-4 h-4" />,
          path: '/admin/navigation'
        }
      ]
    },
    {
      id: 'support',
      label: 'Support & Reports',
      icon: <MessageCircle className="w-5 h-5" />,
      isGroup: true,
      children: [
        {
          id: 'chat',
          label: 'Chat Support',
          icon: <MessageCircle className="w-4 h-4" />,
          path: '/admin/chat'
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: <BarChart3 className="w-4 h-4" />,
          path: '/admin/reports'
        }
      ]
    }
  ];

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      console.log('Toggling group:', groupId, 'New expanded groups:', Array.from(newSet));
      return newSet;
    });
  };

  const handleLogout = async () => {
    try {
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Force logout even if API fails
      navigate('/');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <PickplaceLogo size="md" variant={
          theme === 'light' ? 'black' : 'default'
        } />
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
          aria-label="Close mobile menu"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 sm:py-6 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent touch-pan-y">
        {navItems.map((item) => {
          if (item.isGroup) {
            const isExpanded = expandedGroups.has(item.id);
            return (
              <div key={item.id} className="space-y-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg transition-all group min-h-[44px] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  <span className="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <>
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>

                {/* Group Children */}
                <AnimatePresence>
                  {isExpanded && item.children && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`space-y-1 ${sidebarOpen ? 'ml-4' : ''}`}
                    >
                      {item.children.map((child) => (
                        <div key={child.id} className="relative group">
                          <Link
                            to={child.path!}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group min-h-[36px] ${
                              isActivePath(child.path!)
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            <span className={`${isActivePath(child.path!) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                              {child.icon}
                            </span>
                            {sidebarOpen && (
                              <>
                                <span className="font-medium text-sm">{child.label}</span>
                                {child.badge && (
                                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {child.badge}
                                  </span>
                                )}
                              </>
                            )}
                          </Link>
                          
                          {/* Tooltip for collapsed state */}
                          {!sidebarOpen && (
                            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                              {child.label}
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          } else {
            // Regular menu item
            return (
              <Link
                key={item.id}
                to={item.path!}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg transition-all group min-h-[44px] ${
                  isActivePath(item.path!)
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className={`${isActivePath(item.path!) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          }
        })}
      </nav>

      {/* User Profile & Actions - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {/* User Info Card - Only show when sidebar is open */}
        {sidebarOpen && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 mb-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/30">
                {
                  user?.avatar ? (
                    <img src={user?.avatar?.url} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  )
                }
                  
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold text-sm truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <div className="px-2 py-0.5 bg-white/20 rounded-full">
                    <span className="text-xs text-white font-medium">Admin</span>
                  </div>
                </div>
                <p className="text-orange-100 text-xs truncate">
                  {user?.email || 'rongdhunu503@gmail.com'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {sidebarOpen && (
          <div className="space-y-3">
            {/* Settings & Preferences */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Preferences
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleTheme}
                  className="group flex items-center justify-center gap-2 px-3 py-3 sm:py-2.5 text-xs sm:text-xs bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm min-h-[44px]"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {theme === 'light' ? (
                      <Moon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 group-hover:text-orange-600 transition-colors" />
                    )}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-orange-600 font-medium">
                    {theme === 'light' ? 'Dark' : 'Light'}
                  </span>
                </button>
                
                <button
                  onClick={toggleLanguage}
                  className="group flex items-center justify-center gap-2 px-3 py-3 sm:py-2.5 text-xs sm:text-xs bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm min-h-[44px]"
                >
                  <div className="w-4 h-4 flex items-center justify-center text-sm">
                    {language === 'en' ? '🇧🇩' : '🇺🇸'}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-orange-600 font-medium">
                    {language === 'en' ? 'বাং' : 'Eng'}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="group w-full flex items-center justify-center gap-3 px-4 py-4 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] min-h-[48px]"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
              <span className="font-medium">Sign Out</span>
            </button>
            
            {/* Admin Status */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Admin Session Active
              </span>
            </div>
          </div>
        )}

        {/* Collapsed State */}
        {!sidebarOpen && (
          <div className="space-y-3">
            {/* Collapsed Avatar */}
            <div className="flex justify-center">
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-700 shadow-lg group-hover:ring-orange-300 dark:group-hover:ring-orange-600 transition-all group-hover:scale-105 cursor-pointer">
                  {user?.avatar?.url ? (
                    <img 
                      src={user.avatar.url} 
                      alt="User Avatar" 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                
                {/* Tooltip on hover */}
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {user?.name || 'Admin User'}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-orange-500 mx-auto" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-orange-500 mx-auto" />
                )}
              </button>
              
              <button
                onClick={toggleLanguage}
                className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
                title={`Switch to ${language === 'en' ? 'Bangla' : 'English'}`}
              >
                {language === 'en' ? '🇧🇩' : '🇺🇸'}
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600 mx-auto" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-50 lg:hidden overflow-hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform text-gray-500 dark:text-gray-400 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Home className="w-4 h-4" />
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 dark:text-white font-medium">Admin</span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            
            <Link
              to="/admin/content"
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-4 sm:p-6 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 