import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  Plus,
  Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '../../components/common/Skeleton';
import { useStore } from '../../store/useStore';
import { navigationAPI } from '../../utils/api';

interface NavigationMenuItem {
  id: string;
  title: {
    en: string;
    bn: string;
  };
  path: string;
  icon?: string;
  badge?: {
    text: string;
    color: 'red' | 'orange' | 'green' | 'blue' | 'purple';
  };
  order: number;
  isActive: boolean;
  isExternal: boolean;
  target: '_self' | '_blank';
  parentId?: string;
  permissions: string[];
  cssClass?: string;
  description?: {
    en: string;
    bn: string;
  };
}

const NavigationMenuPage: React.FC = () => {
  const { language } = useStore();
  const [menuItems, setMenuItems] = useState<NavigationMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationMenuItem | null>(null);
  const [formData, setFormData] = useState({
    title: { en: '', bn: '' },
    path: '',
    icon: '',
    badge: { text: '', color: 'orange' as 'red' | 'orange' | 'green' | 'blue' | 'purple' },
    isActive: true,
    isExternal: false,
    target: '_self' as '_self' | '_blank',
    parentId: '',
    permissions: [] as string[],
    cssClass: '',
    description: { en: '', bn: '' }
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await navigationAPI.getAllNavigationMenus();
      if (response.data.success) {
        setMenuItems(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await navigationAPI.deleteNavigationMenu(id);
        setMenuItems(menuItems.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await navigationAPI.toggleNavigationMenuStatus(id);
      setMenuItems(menuItems.map(item => 
        item.id === id ? { ...item, isActive: !item.isActive } : item
      ));
    } catch (error) {
      console.error('Error toggling menu item status:', error);
    }
  };

  const handleReorder = async (items: NavigationMenuItem[]) => {
    try {
      const reorderData = items.map((item, index) => ({
        id: item.id,
        order: index
      }));
      await navigationAPI.reorderNavigationMenus(reorderData);
      setMenuItems(items);
    } catch (error) {
      console.error('Error reordering menu items:', error);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...menuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      setMenuItems(newItems);
      handleReorder(newItems);
    }
  };

  const resetForm = () => {
    setFormData({
      title: { en: '', bn: '' },
      path: '',
      icon: '',
      badge: { text: '', color: 'orange' as const },
      isActive: true,
      isExternal: false,
      target: '_self' as const,
      parentId: '',
      permissions: [] as string[],
      cssClass: '',
      description: { en: '', bn: '' }
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item: NavigationMenuItem) => {
    setFormData({
      title: item.title,
      path: item.path,
      icon: item.icon || '',
      badge: item.badge || { text: '', color: 'orange' as const },
      isActive: item.isActive,
      isExternal: item.isExternal,
      target: item.target,
      parentId: item.parentId || '',
      permissions: item.permissions || [],
      cssClass: item.cssClass || '',
      description: item.description || { en: '', bn: '' }
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const submitData: any = {
        ...formData,
        badge: formData.badge.text ? formData.badge : undefined
      };
      
      // Remove parentId if empty
      if (!formData.parentId) {
        delete submitData.parentId;
      }

      if (editingItem) {
        await navigationAPI.updateNavigationMenu(editingItem.id, submitData);
        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? { ...item, ...submitData } : item
        ));
      } else {
        const response = await navigationAPI.createNavigationMenu(submitData);
        if (response.data.success) {
          setMenuItems([...menuItems, response.data.data]);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title.bn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Navigation Menu Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your website's navigation menu items
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Menu Items List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Path
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Badge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.order}
                      </span>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === filteredItems.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {language === 'bn' ? item.title.bn : item.title.en}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'bn' ? item.title.en : item.title.bn}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {item.path}
                      </span>
                      {item.isExternal && (
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.badge ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.badge.color === 'orange' 
                          ? 'bg-orange-100 text-orange-800' 
                          : item.badge.color === 'green'
                          ? 'bg-green-100 text-green-800'
                          : item.badge.color === 'blue'
                          ? 'bg-blue-100 text-blue-800'
                          : item.badge.color === 'purple'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.badge.text}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.isActive ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No menu items found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first menu item'}
          </p>
        </div>
      )}
      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Title (EN)</label>
                  <input
                    value={formData.title.en}
                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Title (BN)</label>
                  <input
                    value={formData.title.bn}
                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, bn: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Path</label>
                  <input
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    placeholder="/products or https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Icon (optional)</label>
                  <input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">CSS Class (optional)</label>
                  <input
                    value={formData.cssClass}
                    onChange={(e) => setFormData({ ...formData, cssClass: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Badge Text</label>
                  <input
                    value={formData.badge.text}
                    onChange={(e) => setFormData({ ...formData, badge: { ...formData.badge, text: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Badge Color</label>
                  <select
                    value={formData.badge.color}
                    onChange={(e) => setFormData({ ...formData, badge: { ...formData.badge, color: e.target.value as any } })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="orange">Orange</option>
                    <option value="green">Green</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="red">Red</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Target</label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="_self">Same Tab</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">External Link</label>
                  <select
                    value={formData.isExternal ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, isExternal: e.target.value === 'yes' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Description (EN)</label>
                    <input
                      value={formData.description.en}
                      onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Description (BN)</label>
                    <input
                      value={formData.description.bn}
                      onChange={(e) => setFormData({ ...formData, description: { ...formData.description, bn: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationMenuPage;

