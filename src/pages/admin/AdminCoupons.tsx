import { motion } from 'framer-motion';
import { Edit, Plus, Search, TicketPercent, Trash2, User, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, couponAPI } from '../../utils/api';

interface CouponUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Coupon {
  _id: string;
  id?: string; // For backward compatibility
  code: string;
  name: { en: string; bn: string };
  description?: { en?: string; bn?: string };
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  applicableProducts?: string[];
  applicableCategories?: { en: string; bn: string }[];
  userRestrictions?: {
    firstTimeOnly: boolean;
    minOrderCount: number;
    specificUsers: string[];
  };
}

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'expired'|'inactive'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [users, setUsers] = useState<CouponUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<CouponUser[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: { en: '', bn: '' },
    description: { en: '', bn: '' },
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    applicableProducts: [] as string[],
    applicableCategories: [] as { en: string; bn: string }[],
    userRestrictions: {
      firstTimeOnly: false,
      minOrderCount: 0,
      specificUsers: [] as string[]
    }
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await couponAPI.getAllCoupons({ 
        status: statusFilter, 
        search,
        page: currentPage,
        limit: 10
      });
      if (res.data.success) {
        setCoupons(res.data.coupons || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (e) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, currentPage]);

  const fetchUsers = useCallback(async (searchTerm: string = '') => {
    try {
      const res = await adminAPI.getAllUsers({ search: searchTerm, limit: 20 });
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleToggleActive = async (c: Coupon) => {
    try {
      await couponAPI.updateCoupon(c._id, { isActive: !c.isActive });
      toast.success(`Coupon ${!c.isActive ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch (e) {
      toast.error('Failed to update coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      
      if (!id || id === 'undefined') {
        toast.error('Invalid coupon ID');
        return;
      }
      await couponAPI.deleteCoupon(id);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (e: any) {
      console.error('Delete error:', e);
      toast.error(e.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleUserSearch = (searchTerm: string) => {
    setUserSearch(searchTerm);
    if (searchTerm.length > 2) {
      fetchUsers(searchTerm);
      setShowUserSearch(true);
    } else {
      setShowUserSearch(false);
    }
  };

  const handleUserSelect = (user: CouponUser) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
      setFormData({
        ...formData,
        userRestrictions: {
          ...formData.userRestrictions,
          specificUsers: [...formData.userRestrictions.specificUsers, user._id]
        }
      });
    }
    setUserSearch('');
    setShowUserSearch(false);
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    setFormData({
      ...formData,
      userRestrictions: {
        ...formData.userRestrictions,
        specificUsers: formData.userRestrictions.specificUsers.filter(id => id !== userId)
      }
    });
  };

  const handleCreate = () => {
    setEditingCoupon(null);
    setSelectedUsers([]);
    setUserSearch('');
    setShowUserSearch(false);
    setFormData({
      code: '',
      name: { en: '', bn: '' },
      description: { en: '', bn: '' },
      type: 'percentage',
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      applicableProducts: [],
      applicableCategories: [],
      userRestrictions: {
        firstTimeOnly: false,
        minOrderCount: 0,
        specificUsers: []
      }
    });
    setShowModal(true);
  };

  const handleEdit = async (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setUserSearch('');
    setShowUserSearch(false);
    
    // Load selected users if any
    if (coupon.userRestrictions?.specificUsers && coupon.userRestrictions.specificUsers.length > 0) {
      try {
        const userPromises = coupon.userRestrictions.specificUsers.map(userId => 
          adminAPI.getAllUsers({ userId })
        );
        const userResponses = await Promise.all(userPromises);
        const users = userResponses
          .filter(res => res.data.success)
          .map(res => res.data.users?.[0])
          .filter(Boolean);
        setSelectedUsers(users);
      } catch (e) {
        console.error('Failed to load selected users:', e);
        setSelectedUsers([]);
      }
    } else {
      setSelectedUsers([]);
    }
    
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: { en: coupon.description?.en || '', bn: coupon.description?.bn || '' },
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive,
      validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
      validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
      applicableProducts: coupon.applicableProducts || [],
      applicableCategories: coupon.applicableCategories || [],
      userRestrictions: coupon.userRestrictions || {
        firstTimeOnly: false,
        minOrderCount: 0,
        specificUsers: []
      }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert date strings to proper ISO dates
      const submitData = {
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString()
      };

      if (editingCoupon) {
        await couponAPI.updateCoupon(editingCoupon._id, submitData);
        toast.success('Coupon updated');
      } else {
        await couponAPI.createCoupon(submitData);
        toast.success('Coupon created');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save coupon');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-2">
      <div className="container mx-auto px-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage discount codes</p>
          </div>
          <button onClick={handleCreate} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
            <Plus className="w-4 h-4" /> New Coupon
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchCoupons()}
                placeholder="Search code or name..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1); // Reset to first page when filtering
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={fetchCoupons} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => {
             
              return (
              <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl shadow bg-white dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TicketPercent className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{c.code}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{c.name?.en}</p>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>{c.type === 'percentage' ? `${c.value}%` : `৳${c.value}`}</span>
                  {c.maxDiscountAmount ? <span>Max ৳{c.maxDiscountAmount}</span> : null}
                  <span>Used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(c)} className={`px-3 py-1 rounded-lg text-sm ${c.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>{c.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => handleEdit(c)} className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c._id)} className="px-3 py-1 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === i + 1
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="SAVE20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'percentage' | 'fixed'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name (EN) *</label>
                    <input
                      type="text"
                      value={formData.name.en}
                      onChange={(e) => setFormData({...formData, name: {...formData.name, en: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="20% Off"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name (BN)</label>
                    <input
                      type="text"
                      value={formData.name.bn}
                      onChange={(e) => setFormData({...formData, name: {...formData.name, bn: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="২০% ছাড়"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (EN)</label>
                    <textarea
                      value={formData.description.en}
                      onChange={(e) => setFormData({...formData, description: {...formData.description, en: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Get 20% off on your order"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (BN)</label>
                    <textarea
                      value={formData.description.bn}
                      onChange={(e) => setFormData({...formData, description: {...formData.description, bn: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="আপনার অর্ডারে ২০% ছাড় পান"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value *</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder={formData.type === 'percentage' ? '20' : '100'}
                      min="0"
                      max={formData.type === 'percentage' ? '100' : undefined}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Order Amount</label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({...formData, minOrderAmount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Discount</label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({...formData, maxDiscountAmount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="200"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="100 (0 = unlimited)"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valid From *</label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valid Until *</label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Restrictions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="firstTimeOnly"
                        checked={formData.userRestrictions.firstTimeOnly}
                        onChange={(e) => setFormData({
                          ...formData, 
                          userRestrictions: {...formData.userRestrictions, firstTimeOnly: e.target.checked}
                        })}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="firstTimeOnly" className="text-sm text-gray-700 dark:text-gray-300">First time users only</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Order Count</label>
                      <input
                        type="number"
                        value={formData.userRestrictions.minOrderCount}
                        onChange={(e) => setFormData({
                          ...formData, 
                          userRestrictions: {...formData.userRestrictions, minOrderCount: Number(e.target.value)}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Specific Users Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Specific Users (Optional)
                    </label>
                    
                    {/* User Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      
                      {/* User Search Results */}
                      {showUserSearch && users.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {users.map((user) => (
                            <div
                              key={user._id}
                              onClick={() => handleUserSelect(user)}
                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Selected Users ({selectedUsers.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.map((user) => (
                            <div
                              key={user._id}
                              className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{user.name}</span>
                              <button
                                type="button"
                                onClick={() => handleUserRemove(user._id)}
                                className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    {editingCoupon ? 'Update' : 'Create'} Coupon
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;


