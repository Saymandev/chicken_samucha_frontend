import { motion } from 'framer-motion';
import {
    BarChart3,
    Calendar,
    Clock,
    DollarSign,
    Download,
    Mail,
    Package,
    Play,
    ShoppingCart,
    Square,
    TrendingUp,
    Users
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { reportsAPI } from '../../utils/api';

interface DashboardMetrics {
  today: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
  };
  yesterday: {
    revenue: number;
    orders: number;
  };
  week: {
    revenue: number;
    orders: number;
  };
  month: {
    revenue: number;
    orders: number;
  };
  orderStatus: {
    pending: number;
    processing: number;
    ready: number;
    outForDelivery: number;
  };
  recentOrders: Array<{
    orderNumber: string;
    customer: { name: string };
    finalAmount: number;
    orderStatus: string;
    createdAt: string;
  }>;
}

interface SalesAnalytics {
  revenue: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalDeliveryCharge: number;
  };
  dailySales: Array<{
    _id: { year: number; month: number; day: number };
    revenue: number;
    orders: number;
  }>;
  productPerformance: Array<{
    _id: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
    product: {
      name: { en: string; bn: string };
      images: Array<{ url: string }>;
    };
  }>;
  paymentMethods: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  orderStatusDistribution: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  customerAnalytics: {
    totalCustomers: number;
    repeatCustomers: number;
    averageOrdersPerCustomer: number;
    averageCustomerValue: number;
  };
}

const AdminReports: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await reportsAPI.getDashboardMetrics();
      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to fetch dashboard metrics');
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { period: selectedPeriod };
      if (dateRange.startDate && dateRange.endDate) {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }
      
      const response = await reportsAPI.getSalesAnalytics(params);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch sales analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const response = await reportsAPI.getSchedulerStatus();
      if (response.data.success) {
        setSchedulerStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
      // Set a default status if the service is not available
      setSchedulerStatus({
        isRunning: false,
        emailService: {
          initialized: false,
          hasCredentials: false
        }
      });
    }
  }, []);

  useEffect(() => {
    fetchSchedulerStatus();
  }, [fetchSchedulerStatus]);

  const handleExportReport = async (type: string, format: string) => {
    try {
      const params: any = { type, format };
      if (dateRange.startDate && dateRange.endDate) {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }
      
      const response = await reportsAPI.generateReport(params);
      
      if (format === 'csv') {
        // Create and download CSV
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For JSON, download as file
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast.success(`${type} report exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleSendEmailReport = async (type: 'daily' | 'weekly' | 'monthly') => {
    if (emailRecipients.length === 0) {
      toast.error('Please add at least one email recipient');
      return;
    }

    try {
      let response;
      switch (type) {
        case 'daily':
          response = await reportsAPI.sendDailyReport(emailRecipients);
          break;
        case 'weekly':
          response = await reportsAPI.sendWeeklyReport(emailRecipients);
          break;
        case 'monthly':
          response = await reportsAPI.sendMonthlyReport(emailRecipients);
          break;
      }

      if (response.data.success) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report sent successfully`);
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error(`Failed to send ${type} report`);
    }
  };

  const handleSchedulerControl = async (action: 'start' | 'stop') => {
    try {
      let response;
      if (action === 'start') {
        response = await reportsAPI.startScheduler();
      } else {
        response = await reportsAPI.stopScheduler();
      }

      if (response.data.success) {
        toast.success(`Scheduler ${action}ed successfully`);
        fetchSchedulerStatus();
      }
    } catch (error) {
      console.error('Scheduler control error:', error);
      toast.error(`Failed to ${action} scheduler`);
    }
  };

  const addRecipient = () => {
    if (newRecipient && !emailRecipients.includes(newRecipient)) {
      setEmailRecipients([...emailRecipients, newRecipient]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setEmailRecipients(emailRecipients.filter(e => e !== email));
  };

  const handleTestEmail = async () => {
    try {
      const response = await reportsAPI.testEmailService();
      if (response.data.success) {
        toast.success('Test email sent successfully! Check your inbox.');
      } else {
        toast.error(response.data.message || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to send test email');
      }
    }
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'preparing': return 'text-blue-600 bg-blue-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'out_for_delivery': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">Comprehensive business insights and automated reports</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEmailSettings(!showEmailSettings)}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Reports
            </button>
            <button
              onClick={() => handleExportReport('sales', 'csv')}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Sales CSV
            </button>
            <button
              onClick={() => handleExportReport('products', 'csv')}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Products CSV
            </button>
          </div>
        </div>

        {/* Period Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Period</h3>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Start Date"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="End Date"
              />
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Update Report
            </button>
          </div>
        </div>

        {/* Email Reports Panel */}
        {showEmailSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📧 Email Reports</h3>
              <button
                onClick={() => setShowEmailSettings(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>

            {/* Scheduler Status */}
            {schedulerStatus && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Scheduler Status</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${schedulerStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSchedulerControl('start')}
                      disabled={schedulerStatus.isRunning}
                      className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-3 h-3" />
                      Start
                    </button>
                    <button
                      onClick={() => handleSchedulerControl('stop')}
                      disabled={!schedulerStatus.isRunning}
                      className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Square className="w-3 h-3" />
                      Stop
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Recipients */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Email Recipients</h4>
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={addRecipient}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
              {emailRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {emailRecipients.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{email}</span>
                      <button
                        onClick={() => removeRecipient(email)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <Square className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Service Status */}
            {schedulerStatus?.emailService && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Email Service Status</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${schedulerStatus.emailService.initialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {schedulerStatus.emailService.initialized ? 'Initialized' : 'Not Initialized'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${schedulerStatus.emailService.hasCredentials ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {schedulerStatus.emailService.hasCredentials ? 'Credentials Found' : 'No Credentials'}
                    </span>
                  </div>
                </div>
                {!schedulerStatus.emailService.initialized && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Email service is not initialized. Please check your email credentials in the environment variables.
                  </p>
                )}
              </div>
            )}

            {/* Manual Report Sending */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Send Reports Now</h4>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handleSendEmailReport('daily')}
                  disabled={!schedulerStatus?.emailService?.initialized}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Daily Report
                </button>
                <button
                  onClick={() => handleSendEmailReport('weekly')}
                  disabled={!schedulerStatus?.emailService?.initialized}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Weekly Report
                </button>
                <button
                  onClick={() => handleSendEmailReport('monthly')}
                  disabled={!schedulerStatus?.emailService?.initialized}
                  className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Monthly Report
                </button>
                <button
                  onClick={handleTestEmail}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Test Email
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Real-time Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(metrics.today.revenue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {metrics.today.orders} orders
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(metrics.week.revenue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {metrics.week.orders} orders
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(metrics.month.revenue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {metrics.month.orders} orders
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(metrics.today.averageOrderValue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    per order
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-orange-500" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Order Status Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metrics.orderStatus.pending}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metrics.orderStatus.processing}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ready</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metrics.orderStatus.ready}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Out for Delivery</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metrics.orderStatus.outForDelivery}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Analytics Charts */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(analytics.revenue.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Orders</span>
                  <span className="text-xl font-bold text-blue-600">
                    {analytics.revenue.totalOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Order Value</span>
                  <span className="text-xl font-bold text-purple-600">
                    {formatCurrency(analytics.revenue.averageOrderValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Delivery Charges</span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatCurrency(analytics.revenue.totalDeliveryCharge)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Customer Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Analytics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Customers</span>
                  <span className="text-xl font-bold text-green-600">
                    {analytics.customerAnalytics.totalCustomers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Repeat Customers</span>
                  <span className="text-xl font-bold text-blue-600">
                    {analytics.customerAnalytics.repeatCustomers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Avg Orders per Customer</span>
                  <span className="text-xl font-bold text-purple-600">
                    {analytics.customerAnalytics.averageOrdersPerCustomer.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Avg Customer Value</span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatCurrency(analytics.customerAnalytics.averageCustomerValue)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Top Products */}
        {analytics && analytics.productPerformance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Products</h3>
            <div className="space-y-4">
              {analytics.productPerformance.slice(0, 5).map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                    <img
                      src={product.product.images[0]?.url || '/placeholder-product.jpg'}
                      alt={product.product.name.en}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.product.name.en}</p>
                      <p className="text-sm text-gray-500">Sold {product.totalQuantity} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(product.totalRevenue)}</p>
                    <p className="text-sm text-gray-500">{product.orderCount} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Orders */}
        {metrics && metrics.recentOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {metrics.recentOrders.map((order) => (
                <div key={order.orderNumber} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.finalAmount)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
