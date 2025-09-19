import { AnimatePresence, motion } from 'framer-motion';
import {
  Edit2,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { categoriesAPI } from '../../utils/api';

interface Category {
  _id: string;
  name: {
    en: string;
    bn: string;
  };
  description?: {
    en: string;
    bn: string;
  };
  slug: string;
  image?: {
    url: string;
    public_id: string;
  };
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  parentCategory?: { _id: string; name: { en: string; bn: string } } | null;
  isSubcategory?: boolean;
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: { en: '', bn: '' },
    description: { en: '', bn: '' },
    slug: '',
    icon: '📦',
    color: '#3B82F6',
    isActive: true,
    sortOrder: 0,
    parentCategory: '',
    isSubcategory: false
  });

  // Color presets
  const colorPresets = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Icon presets
  const iconPresets = [
    '📦', '🍕', '🍔', '🍰', '🥤', '🍜', '🍱', '🥗', '🍪', '🍩',
    '🥐', '🍞', '🥨', '🧀', '🥓', '🍳', '🥞', '🧇', '🥯', '🍯'
  ];

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        withProductCount: true
      };
      const response = await categoriesAPI.getAllCategories(params);
      if (response.data.success) {
        setCategories(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesAPI.updateCategory(editingCategory._id, formData);
        toast.success('Category updated successfully');
      } else {
        await categoriesAPI.createCategory(formData);
        toast.success('Category created successfully');
      }
      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      // Refresh the categories list
      await fetchCategories();
    } catch (error: any) {
      console.error('Submit category error:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || { en: '', bn: '' },
      slug: category.slug,
      icon: category.icon,
      color: category.color,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      parentCategory: (category.parentCategory as any)?._id || '',
      isSubcategory: Boolean(category.isSubcategory)
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoriesAPI.deleteCategory(id);
      toast.success('Category deleted successfully');
      await fetchCategories();
    } catch (error: any) {
      console.error('Delete category error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await categoriesAPI.toggleCategoryStatus(id);
      toast.success('Category status updated');
      await fetchCategories();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error('Failed to update category status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: { en: '', bn: '' },
      description: { en: '', bn: '' },
      slug: '',
      icon: '📦',
      color: '#3B82F6',
      isActive: true,
      sortOrder: 0,
      parentCategory: '',
      isSubcategory: false
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (lang: 'en' | 'bn', value: string) => {
    setFormData(prev => ({
      ...prev,
      name: { ...prev.name, [lang]: value },
      slug: lang === 'en' ? generateSlug(value) : prev.slug
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage product categories</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <motion.div
            key={category._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            {/* Category Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {category.name.en}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.name.bn}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(category._id)}
                  className={`p-2 rounded-lg transition-colors ${
                    category.isActive 
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                      : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {category.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category._id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Products:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {category.productCount}
                </span>
              </div>
              {category.parentCategory && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Parent:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(category.parentCategory as any).name?.en}
                  </span>
                </div>
              )}
              {category.isSubcategory && (
                <div className="text-xs inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Subcategory
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Slug:</span>
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                  {category.slug}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Order:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {category.sortOrder}
                </span>
              </div>
            </div>

            {/* Description */}
            {category.description?.en && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {category.description.en}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === i + 1
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {categories.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No categories yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first category to organize your products
          </p>
          <button
            onClick={() => {
              setEditingCategory(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            Add Category
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit} className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingCategory ? 'Edit Category' : 'Add Category'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name (English) *
                      </label>
                      <input
                        type="text"
                        value={formData.name.en}
                        onChange={(e) => handleNameChange('en', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name (Bengali) *
                      </label>
                      <input
                        type="text"
                        value={formData.name.bn}
                        onChange={(e) => handleNameChange('bn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Description Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description (English)
                      </label>
                      <textarea
                        value={formData.description.en}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          description: { ...prev.description, en: e.target.value }
                        }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description (Bengali)
                      </label>
                      <textarea
                        value={formData.description.bn}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          description: { ...prev.description, bn: e.target.value }
                        }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  {/* Icon and Color */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Icon
                      </label>
                      <div className="grid grid-cols-10 gap-2">
                        {iconPresets.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, icon }))}
                            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-colors ${
                              formData.icon === icon
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            className={`w-8 h-8 rounded-lg border-2 transition-colors ${
                              formData.color === color
                                ? 'border-gray-900 dark:border-white'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Subcategory Toggle & Parent Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isSubcategory"
                        checked={formData.isSubcategory}
                        onChange={(e) => setFormData(prev => ({ ...prev, isSubcategory: e.target.checked, parentCategory: e.target.checked ? prev.parentCategory : '' }))}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="isSubcategory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Is Subcategory
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Parent Category {formData.isSubcategory ? '*' : ''}
                      </label>
                      <select
                        value={formData.parentCategory}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentCategory: e.target.value }))}
                        className="input w-full dark:bg-gray-700 dark:text-white"
                        disabled={!formData.isSubcategory}
                        required={formData.isSubcategory}
                      >
                        <option value="">Select parent</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name.en}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
