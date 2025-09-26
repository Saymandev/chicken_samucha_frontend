import { motion } from 'framer-motion';
import { Calendar, Clock, Palette, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Product } from '../../store/useStore';
import { adminAPI } from '../../utils/api';

interface FlashSaleFormData {
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  startTime: string;
  endTime: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  backgroundColor: string;
  textColor: string;
  priority: number;
  products: Array<{
    productId: string;
    stockLimit?: number;
  }>;
}

interface FlashSaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingFlashSale?: any;
}

const FlashSaleFormModal: React.FC<FlashSaleFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingFlashSale
}) => {
  const [formData, setFormData] = useState<FlashSaleFormData>({
    title: { en: '', bn: '' },
    description: { en: '', bn: '' },
    startTime: '',
    endTime: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: undefined,
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
    priority: 0,
    products: []
  });

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [productStockLimits, setProductStockLimits] = useState<{[key: string]: number}>({});

  // Color presets
  const colorPresets = [
    '#dc2626', '#db2777', '#c2410c', '#ea580c', '#d97706',
    '#ca8a04', '#65a30d', '#16a34a', '#059669', '#0891b2',
    '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#a21caf'
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const response = await adminAPI.getAllProducts({
        search: productSearchTerm || undefined,
        limit: 50
      });
      if (response.data.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  }, [productSearchTerm]);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      
      if (editingFlashSale) {
        // Convert UTC times back to local datetime-local format
        const startDate = new Date(editingFlashSale.startTime);
        const endDate = new Date(editingFlashSale.endTime);
        
        // Format for datetime-local input (YYYY-MM-DDTHH:mm)
        const formatForDateTimeLocal = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };
        
        // Populate form with existing data
        setFormData({
          title: editingFlashSale.title,
          description: editingFlashSale.description,
          startTime: formatForDateTimeLocal(startDate),
          endTime: formatForDateTimeLocal(endDate),
          discountType: editingFlashSale.discountType,
          discountValue: editingFlashSale.discountValue,
          maxDiscountAmount: editingFlashSale.maxDiscountAmount,
          backgroundColor: editingFlashSale.backgroundColor,
          textColor: editingFlashSale.textColor,
          priority: editingFlashSale.priority,
          products: editingFlashSale.products.map((p: any) => ({
            productId: p.product._id,
            stockLimit: p.stockLimit
          }))
        });
        
        const selectedIds = new Set<string>(editingFlashSale.products.map((p: any) => p.product._id));
        setSelectedProducts(selectedIds);
        
        const stockLimits: {[key: string]: number} = {};
        editingFlashSale.products.forEach((p: any) => {
          if (p.stockLimit) {
            stockLimits[p.product._id] = p.stockLimit;
          }
        });
        setProductStockLimits(stockLimits);
      }
    }
  }, [isOpen, editingFlashSale, fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product');
      return;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      
      // Convert local datetime-local values to proper ISO strings
      const startTimeISO = new Date(formData.startTime).toISOString();
      const endTimeISO = new Date(formData.endTime).toISOString();
      
      const submitData = {
        ...formData,
        startTime: startTimeISO,
        endTime: endTimeISO,
        products: Array.from(selectedProducts).map(productId => ({
          productId,
          stockLimit: productStockLimits[productId] || undefined
        }))
      };

      if (editingFlashSale) {
        await adminAPI.updateFlashSale(editingFlashSale._id, submitData);
        toast.success('Flash sale updated successfully');
      } else {
        await adminAPI.createFlashSale(submitData);
        toast.success('Flash sale created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Submit flash sale error:', error);
      toast.error(`Failed to ${editingFlashSale ? 'update' : 'create'} flash sale`);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      const newStockLimits = { ...productStockLimits };
      delete newStockLimits[productId];
      setProductStockLimits(newStockLimits);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const updateStockLimit = (productId: string, limit: number) => {
    setProductStockLimits(prev => ({
      ...prev,
      [productId]: limit
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingFlashSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (English) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    title: { ...prev.title, en: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Flash Sale Title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (Bengali) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title.bn}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    title: { ...prev.title, bn: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="ফ্ল্যাশ সেল শিরোনাম"
                />
              </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Discount Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount Type *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount Value *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={formData.discountType === 'percentage' ? '25' : '100'}
                />
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Discount (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="500"
                  />
                </div>
              )}
            </div>

            {/* Styling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1">
                    {colorPresets.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, backgroundColor: color }))}
                        className="w-6 h-6 rounded border-2 border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Color
                </label>
                <select
                  value={formData.textColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="#ffffff">White</option>
                  <option value="#000000">Black</option>
                  <option value="#f3f4f6">Light Gray</option>
                  <option value="#374151">Dark Gray</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Preview */}
            <div 
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: formData.backgroundColor, color: formData.textColor }}
            >
              <div className="font-bold">
                🔥 {formData.title.en || 'Flash Sale Preview'} - {formData.discountType === 'percentage' ? `${formData.discountValue}%` : `৳${formData.discountValue}`} OFF ⚡
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Products * ({selectedProducts.size} selected)
              </label>
              
              {/* Product Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Products List */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {loadingProducts ? (
                  <div className="p-4 text-center">Loading products...</div>
                ) : products.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No products found</div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product) => (
                      <div key={product.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          
                          <img
                            src={product.images[0]?.url || '/placeholder.png'}
                            alt={product.name.en}
                            className="w-12 h-12 object-cover rounded"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {product.name.en}
                            </div>
                            <div className="text-sm text-gray-500">
                              ৳{product.price} • Stock: {product.stock}
                            </div>
                          </div>

                          {selectedProducts.has(product.id) && (
                            <div className="flex items-center space-x-2">
                              <label className="text-xs text-gray-600">Stock Limit:</label>
                              <input
                                type="number"
                                min="1"
                                max={product.stock}
                                value={productStockLimits[product.id] || ''}
                                onChange={(e) => updateStockLimit(product.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                placeholder="All"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedProducts.size === 0}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (editingFlashSale ? 'Update Flash Sale' : 'Create Flash Sale')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FlashSaleFormModal;
