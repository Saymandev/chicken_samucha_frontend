import { motion } from 'framer-motion';
import {
  Camera,
  Edit,
  Globe,
  Lock,
  Mail,
  MapPin,
  Moon,
  Phone,
  Save,
  Sun,
  User,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { authAPI, ordersAPI, reviewsAPI } from '../utils/api';

// Extended User interface for ProfilePage
interface UserWithAddress {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  avatar?: {
    url: string;
    public_id: string;
  };
  address?: {
    street: string;
    area: string;
    city: string;
    district: string;
    postalCode?: string;
  };
  preferredLanguage: 'en' | 'bn';
  preferredTheme: 'light' | 'dark';
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, theme, language, setTheme, setLanguage, setUser } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: (user as UserWithAddress)?.address?.street || '',
      area: (user as UserWithAddress)?.address?.area || '',
      city: (user as UserWithAddress)?.address?.city || '',
      district: (user as UserWithAddress)?.address?.district || ''
    }
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [userStats, setUserStats] = useState({ orders: 0, reviews: 0 });
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Fetch user statistics
  React.useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      
      try {
        const [ordersRes, reviewsRes] = await Promise.all([
          ordersAPI.getMyOrders({ limit: 1 }),
          reviewsAPI.getMyReviews({ limit: 1 })
        ]);
        
        setUserStats({
          orders: ordersRes.data.total || 0,
          reviews: reviewsRes.data.total || 0
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        // Set fallback values if API calls fail
        setUserStats({ orders: 0, reviews: 0 });
      }
    };

    fetchUserStats();
  }, [user]);

  // Fetch user reviews
  React.useEffect(() => {
    const fetchUserReviews = async () => {
      if (!user) return;
      
      setReviewsLoading(true);
      try {
        const response = await reviewsAPI.getMyReviews({ limit: 5 });
        setUserReviews(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch user reviews:', error);
        setUserReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchUserReviews();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.updateDetails(formData);
      if (response.data.success) {
        setUser(response.data.user);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.updatePassword(passwordData);
      if (response.data.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
        toast.success('Password updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    try {
      await authAPI.updateDetails({ preferredTheme: newTheme });
      if (user) {
        setUser({ ...user, preferredTheme: newTheme });
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const handleLanguageChange = async (newLanguage: 'en' | 'bn') => {
    setLanguage(newLanguage);
    try {
      await authAPI.updateDetails({ preferredLanguage: newLanguage });
      if (user) {
        setUser({ ...user, preferredLanguage: newLanguage });
      }
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await authAPI.uploadAvatar(formData);
      if (response.data.success) {
        setUser({ ...user!, avatar: response.data.avatar });
        toast.success('Profile picture updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const userWithAddress = user as UserWithAddress;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
                      {user.avatar?.url ? (
                        <img
                          src={user.avatar.url}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                      <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={avatarUploading}
                      />
                    </label>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {user.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Customer'}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.orders}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.reviews}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Personal Information
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 text-orange-600 hover:text-orange-800 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Area
                        </label>
                        <input
                          type="text"
                          name="address.area"
                          value={formData.address.area}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          District
                        </label>
                        <input
                          type="text"
                          name="address.district"
                          value={formData.address.district}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">{user.phone}</p>
                      </div>
                    </div>
                    {userWithAddress.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {userWithAddress.address.street}, {userWithAddress.address.area}, {userWithAddress.address.city}, {userWithAddress.address.district}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Settings
                </h3>
                
                <div className="space-y-6">
                  {/* Theme Setting */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Moon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Choose your preferred theme
                        </p>
                      </div>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          theme === 'light'
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          theme === 'dark'
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>

                  {/* Language Setting */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Language</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Choose your preferred language
                        </p>
                      </div>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          language === 'en'
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => handleLanguageChange('bn')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          language === 'bn'
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        বাংলা
                      </button>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Password</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Change your account password
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="text-orange-600 hover:text-orange-800 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>

              {/* My Reviews Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    My Reviews ({userStats.reviews})
                  </h3>
                  {userStats.reviews > 5 && (
                    <button className="text-orange-600 hover:text-orange-800 transition-colors text-sm">
                      View All
                    </button>
                  )}
                </div>

                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : userReviews.length > 0 ? (
                  <div className="space-y-4">
                    {userReviews.map((review, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${
                                    i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {review.product?.name?.en || review.product?.name || 'General Review'}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            review.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            review.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {review.status}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {review.comment?.en || review.comment}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Start reviewing products you've purchased!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Change Password Modal */}
        {isChangingPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 