import { motion } from 'framer-motion';
import {
    AlertTriangle,
    DollarSign,
    MessageCircle,
    Package,
    Plus,
    Settings,
    ShoppingBag,
    Star,
    TrendingUp,
    Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import {
    DashboardCardSkeleton,
    GridSkeleton,
    TableRowSkeleton
} from '../components/common/Skeleton';
import { useStore } from '../store/useStore';
import { adminAPI } from '../utils/api';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  averageRating: number;
  totalReviews: number;
  monthlyRevenue: number;
  weeklyOrders: number;
  newUsersThisMonth: number;
  pendingReviews: number;
  monthlyGrowth: {
    revenue: number;
    orders: number;
    users: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customer: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  topProducts: Array<{
    _id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: { name: string; phone: string };
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentStatus: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  count?: number;
}

const AdminDashboard: React.FC = () => {
  const { language, user } = useStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      setLoadingOrders(true);
      setLoadingUsers(true);

      // Fetch dashboard stats
      const statsResponse = await adminAPI.getDashboardStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }
      setLoadingStats(false);

      // Fetch recent orders
      const ordersResponse = await adminAPI.getAllOrders({ limit: 5, sort: '-createdAt' });
      if (ordersResponse.data.success) {
        setRecentOrders(ordersResponse.data.orders || []);
      }
      setLoadingOrders(false);

      // Fetch recent users  
      const usersResponse = await adminAPI.getAllUsers({ limit: 5, sort: '-createdAt' });
      if (usersResponse.data.success) {
        setRecentUsers(usersResponse.data.users || []);
      }
      setLoadingUsers(false);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoadingStats(false);
      setLoadingOrders(false);
      setLoadingUsers(false);
      
      // Set empty stats if API fails
      setStats({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageRating: 0,
        totalReviews: 0,
        monthlyRevenue: 0,
        weeklyOrders: 0,
        newUsersThisMonth: 0,
        pendingReviews: 0,
        monthlyGrowth: {
          revenue: 0,
          orders: 0,
          users: 0
        },
        recentOrders: [],
        topProducts: []
      });
      
      setRecentOrders([]);
      setRecentUsers([]);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Add New Product',
      description: 'Create a new product listing',
      icon: <Plus className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      path: '/admin/products',
      count: stats?.totalProducts
    },
    {
      title: 'Manage Orders',
      description: 'View and process orders',
      icon: <ShoppingBag className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600',
      path: '/admin/orders',
      count: stats?.pendingOrders
    },
    {
      title: 'Review Management',
      description: 'Moderate customer reviews',
      icon: <Star className="w-6 h-6" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      path: '/admin/reviews',
      count: stats?.pendingReviews
    },
    {
      title: 'User Management',
      description: 'Manage user accounts',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      path: '/admin/users',
      count: stats?.totalUsers
    },
    {
      title: 'Content Management',
      description: 'Manage website content & settings',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      path: '/admin/content'
    },
    {
      title: 'Chat Support',
      description: 'Handle customer inquiries',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      path: '/admin/chat'
    },
    {
      title: 'Categories',
      description: 'Manage product categories',
      icon: <Package className="w-6 h-6" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      path: '/admin/categories'
    }
  ];

  const getStatusColor = (status: string) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down';
  }> = ({ title, value, change, icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
              {trend === 'down' && <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (loadingStats) {
    return (
      <div className="space-y-6">
        <GridSkeleton 
          items={8} 
          ItemComponent={DashboardCardSkeleton}
          columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Unable to load dashboard data
        </h2>
        <button 
          onClick={fetchDashboardData}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 ${
          language === 'bn' ? 'font-bengali' : ''
        }`}>
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name}! Here's what's happening with your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`৳${(stats.totalRevenue || 0).toLocaleString()}`}
          change={`${stats.totalReviews || 0} reviews`}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-green-500"
          trend={stats.monthlyGrowth?.revenue >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Total Orders"
          value={(stats.totalOrders || 0).toLocaleString()}
          change={`${stats.totalReviews || 0} reviews`}
          icon={<ShoppingBag className="w-6 h-6 text-white" />}
          color="bg-blue-500"
          trend={stats.monthlyGrowth?.orders >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Total Users"
          value={(stats.totalUsers || 0).toLocaleString()}
          change={`${stats.totalReviews || 0} reviews`}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          trend={stats.monthlyGrowth?.users >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Average Rating"
          value={`${(stats.averageRating || 0).toFixed(1)}/5`}
          change={`${stats.totalReviews || 0} reviews`}
          icon={<Star className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders || 0}
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
        <StatCard
          title="Monthly Revenue"
          value={`৳${(stats.monthlyRevenue || 0).toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-teal-500"
        />
        <StatCard
          title="New Users"
          value={stats.newUsersThisMonth || 0}
          change="This month"
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-indigo-500"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts || 0}
          icon={<Package className="w-6 h-6 text-white" />}
          color="bg-gray-500"
        />
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sales Growth</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              +{stats.monthlyGrowth?.revenue || 0}.0%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">vs last month</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customer Growth</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              +{stats.monthlyGrowth?.users || 0}.0%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">vs last month</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Satisfaction</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
              {(stats.averageRating || 0).toFixed(1)}/5
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">average rating</p>
          </div>
        </div>
      </div>

      
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(action.path)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-full text-white transition-colors ${action.color}`}>
                  {action.icon}
                </div>
                {action.count !== undefined && (
                  <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-sm px-2 py-1 rounded-full">
                    {action.count}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {action.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Orders
            </h2>
            <Link
              to="/admin/orders"
              className="text-orange-600 hover:text-orange-800 transition-colors text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {loadingOrders ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <TableRowSkeleton key={i} columns={3} />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customer.name} • {order.customer.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ৳{order.totalAmount}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {order.status || 'Unknown'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Users
            </h2>
            <Link
              to="/admin/users"
              className="text-orange-600 hover:text-orange-800 transition-colors text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {loadingUsers ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <TableRowSkeleton key={i} columns={3} />
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No recent users</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 