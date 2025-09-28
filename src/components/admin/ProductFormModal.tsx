import { motion } from 'framer-motion';
import { ImagePlus, Palette, Plus, Ruler, Trash2, Weight, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { adminAPI, categoriesAPI } from '../../utils/api';

interface Product {
  _id?: string;
  name: { en: string; bn: string };
  description: { en: string; bn: string };
  price: number;
  discountPrice?: number;
  images: Array<{ url: string; public_id: string }>;
  category: string;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  youtubeVideoUrl?: string;
  variants?: {
    colors?: Array<{
      name: { en: string; bn: string };
      hex: string;
      price: number;
      stock: number;
      images: Array<{ url: string; public_id: string }>;
    }>;
    sizes?: Array<{
      name: { en: string; bn: string };
      dimensions: string;
      price: number;
      stock: number;
    }>;
    weights?: Array<{
      name: { en: string; bn: string };
      value: number;
      unit: 'g' | 'kg' | 'lb' | 'oz';
      price: number;
      stock: number;
    }>;
  };
  defaultVariant?: {
    color?: string;
    size?: string;
    weight?: string;
  };
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}


const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess
}) => {
  const { language } = useStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ _id: string; name: { en: string; bn: string } }>>([]);
  
  
  const [formData, setFormData] = useState({
    name: { en: '', bn: '' },
    description: { en: '', bn: '' },
    price: 0,
    discountPrice: 0,
    category: '',
    stock: 0,
    isAvailable: true,
    isFeatured: false,
    youtubeVideoUrl: '',
    variants: {
      colors: [] as Array<{
        name: { en: string; bn: string };
        hex: string;
        price: number;
        stock: number;
        images: Array<{ url: string; public_id: string }>;
      }>,
      sizes: [] as Array<{
        name: { en: string; bn: string };
        dimensions: string;
        price: number;
        stock: number;
      }>,
      weights: [] as Array<{
        name: { en: string; bn: string };
        value: number;
        unit: 'g' | 'kg' | 'lb' | 'oz';
        price: number;
        stock: number;
      }>
    },
    defaultVariant: {
      color: '',
      size: '',
      weight: ''
    }
  });
  
  const [images, setImages] = useState<Array<{ url: string; public_id: string }>>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || { en: '', bn: '' },
        description: product.description || { en: '', bn: '' },
        price: product.price || 0,
        discountPrice: product.discountPrice || 0,
        category: product.category || '',
        stock: product.stock || 0,
        isAvailable: product.isAvailable ?? true,
        isFeatured: product.isFeatured ?? false,
        youtubeVideoUrl: product.youtubeVideoUrl || '',
        variants: {
          colors: product.variants?.colors || [],
          sizes: product.variants?.sizes || [],
          weights: product.variants?.weights || []
        },
        defaultVariant: {
          color: product.defaultVariant?.color || '',
          size: product.defaultVariant?.size || '',
          weight: product.defaultVariant?.weight || ''
        }
      });
      setImages(product.images || []);
    } else {
      // Reset form for new product
      setFormData({
        name: { en: '', bn: '' },
        description: { en: '', bn: '' },
        price: 0,
        discountPrice: 0,
        category: '',
        stock: 0,
        isAvailable: true,
        isFeatured: false,
        youtubeVideoUrl: '',
        variants: {
          colors: [],
          sizes: [],
          weights: []
        },
        defaultVariant: {
          color: '',
          size: '',
          weight: ''
        }
      });
      setImages([]);
    }
    setNewImages([]);
  }, [product, isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAllCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const handleInputChange = (field: string, value: any, lang?: string) => {
    if (lang) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field as keyof typeof prev] as object,
          [lang]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleImageUpload = (files: FileList | null) => {
    
    if (!files) return;
    
    const fileArray = Array.from(files);
    
    
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return false;
      }
      return true;
    });

    
    setNewImages(prev => {
      const updated = [...prev, ...validFiles];
      
      return updated;
    });
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Variant Management Functions
  const addColorVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        colors: [...prev.variants.colors, {
          name: { en: '', bn: '' },
          hex: '#000000',
          price: 0,
          stock: 0,
          images: []
        }]
      }
    }));
  };

  const removeColorVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        colors: prev.variants.colors.filter((_, i) => i !== index)
      }
    }));
  };

  const updateColorVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        colors: prev.variants.colors.map((color, i) => 
          i === index ? { ...color, [field]: value } : color
        )
      }
    }));
  };

  const addSizeVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        sizes: [...prev.variants.sizes, {
          name: { en: '', bn: '' },
          dimensions: '',
          price: 0,
          stock: 0
        }]
      }
    }));
  };

  const removeSizeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        sizes: prev.variants.sizes.filter((_, i) => i !== index)
      }
    }));
  };

  const updateSizeVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        sizes: prev.variants.sizes.map((size, i) => 
          i === index ? { ...size, [field]: value } : size
        )
      }
    }));
  };

  const addWeightVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        weights: [...prev.variants.weights, {
          name: { en: '', bn: '' },
          value: 0,
          unit: 'g' as 'g' | 'kg' | 'lb' | 'oz',
          price: 0,
          stock: 0
        }]
      }
    }));
  };

  const removeWeightVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        weights: prev.variants.weights.filter((_, i) => i !== index)
      }
    }));
  };

  const updateWeightVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        weights: prev.variants.weights.map((weight, i) => 
          i === index ? { ...weight, [field]: value } : weight
        )
      }
    }));
  };

  const validateForm = () => {
    // Also check file input directly as backup
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const fileInputFiles = fileInput?.files ? Array.from(fileInput.files) : [];
    
    
    
    if (!formData.name.en.trim()) {
      toast.error('English name is required');
      return false;
    }
    if (!formData.name.bn.trim()) {
      
      // Auto-fill Bengali name with English name if empty
      formData.name.bn = formData.name.en;
    }
    if (!formData.description.en.trim()) {
      toast.error('English description is required');
      return false;
    }
    if (!formData.description.bn.trim()) {
      
      // Auto-fill Bengali description with English description if empty
      formData.description.bn = formData.description.en;
    }
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return false;
    }
    if (formData.discountPrice && formData.discountPrice >= formData.price) {
      toast.error('Discount price must be less than regular price');
      return false;
    }
    if (formData.stock < 0) {
      toast.error('Stock cannot be negative');
      return false;
    }
    
    // Check for images in multiple ways
    const hasExistingImages = images.length > 0;
    const hasNewImages = newImages.length > 0;
    const hasFileInputImages = fileInputFiles.length > 0;
    
    if (!hasExistingImages && !hasNewImages && !hasFileInputImages) {
      
      toast.error('At least one product image is required');
      return false;
    }
    
    // If we have file input images but they're not in newImages state, add them
    if (hasFileInputImages && !hasNewImages) {
      
      setNewImages(fileInputFiles.filter(file => file.type.startsWith('image/')));
    }
    
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    

    
    if (!validateForm()) {
      
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = new FormData();
      
      // Add text data
      submitData.append('name', JSON.stringify(formData.name));
      submitData.append('description', JSON.stringify(formData.description));
      submitData.append('price', formData.price.toString());
      if (formData.discountPrice) {
        submitData.append('discountPrice', formData.discountPrice.toString());
      }
      submitData.append('category', JSON.stringify(formData.category));
      submitData.append('stock', formData.stock.toString());
      submitData.append('isAvailable', formData.isAvailable.toString());
      submitData.append('isFeatured', formData.isFeatured.toString());
      submitData.append('youtubeVideoUrl', formData.youtubeVideoUrl);
      
      // Add variants data
      submitData.append('variants', JSON.stringify(formData.variants));
      submitData.append('defaultVariant', JSON.stringify(formData.defaultVariant));
      
      // Add new image files from state
      
      newImages.forEach((file, index) => {
        
        submitData.append('images', file);
      });
      
      // Also check file input directly as backup
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput?.files && fileInput.files.length > 0 && newImages.length === 0) {
        
        Array.from(fileInput.files).forEach(file => {
          if (file.type.startsWith('image/')) {
            
            submitData.append('images', file);
          }
        });
      }
      
      // Add existing images (for updates only)
      if (product?._id && images.length > 0) {
        submitData.append('existingImages', JSON.stringify(images));
      }
      
      // If no new images and it's an update, don't replace images
      if (product?._id && newImages.length === 0) {
        submitData.append('replaceImages', 'false');
      }
      
      // Debug: Log FormData contents
      
     
      
      
     
      
      
      if (product?._id) {
        // Update existing product
       
        await adminAPI.updateProduct(product._id, submitData);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        
         await adminAPI.createProduct(submitData);
        
        toast.success('Product created successfully!');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name (English) *
              </label>
              <input
                type="text"
                value={formData.name.en}
                onChange={(e) => handleInputChange('name', e.target.value, 'en')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name (Bengali) *
              </label>
              <input
                type="text"
                value={formData.name.bn}
                onChange={(e) => handleInputChange('name', e.target.value, 'bn')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Product Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (English) *
              </label>
              <textarea
                value={formData.description.en}
                onChange={(e) => handleInputChange('description', e.target.value, 'en')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Bengali) *
              </label>
              <textarea
                value={formData.description.bn}
                onChange={(e) => handleInputChange('description', e.target.value, 'bn')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Ingredients removed */}

          {/* YouTube Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              YouTube Video URL (Optional)
            </label>
            <input
              type="url"
              value={formData.youtubeVideoUrl}
              onChange={(e) => handleInputChange('youtubeVideoUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add a YouTube video URL to showcase your product
            </p>
          </div>

          {/* Price and Category */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (৳) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Price (৳)
              </label>
              <input
                type="number"
                value={formData.discountPrice || ''}
                onChange={(e) => handleInputChange('discountPrice', parseInt(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {language === 'bn' ? category.name.bn : category.name.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Product Status */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Available for Sale
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Featured Product
              </span>
            </label>
          </div>

          {/* Product Variants */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Product Variants (Optional)
            </h3>

            {/* Color Variants */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Color Variants</h4>
                </div>
                <button
                  type="button"
                  onClick={addColorVariant}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Color
                </button>
              </div>

              {formData.variants.colors.map((color, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Color {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeColorVariant(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Name (EN)
                      </label>
                      <input
                        type="text"
                        value={color.name.en}
                        onChange={(e) => updateColorVariant(index, 'name', { ...color.name, en: e.target.value })}
                        placeholder="Red"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Name (BN)
                      </label>
                      <input
                        type="text"
                        value={color.name.bn}
                        onChange={(e) => updateColorVariant(index, 'name', { ...color.name, bn: e.target.value })}
                        placeholder="লাল"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Color
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updateColorVariant(index, 'hex', e.target.value)}
                          className="w-8 h-8 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={color.hex}
                          onChange={(e) => updateColorVariant(index, 'hex', e.target.value)}
                          placeholder="#FF0000"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Price Diff (৳)
                        </label>
                        <input
                          type="number"
                          value={color.price}
                          onChange={(e) => updateColorVariant(index, 'price', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={color.stock}
                          onChange={(e) => updateColorVariant(index, 'stock', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Size Variants */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Size Variants</h4>
                </div>
                <button
                  type="button"
                  onClick={addSizeVariant}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Size
                </button>
              </div>

              {formData.variants.sizes.map((size, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Size {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSizeVariant(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Name (EN)
                      </label>
                      <input
                        type="text"
                        value={size.name.en}
                        onChange={(e) => updateSizeVariant(index, 'name', { ...size.name, en: e.target.value })}
                        placeholder="Small"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Name (BN)
                      </label>
                      <input
                        type="text"
                        value={size.name.bn}
                        onChange={(e) => updateSizeVariant(index, 'name', { ...size.name, bn: e.target.value })}
                        placeholder="ছোট"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Dimensions
                      </label>
                      <input
                        type="text"
                        value={size.dimensions}
                        onChange={(e) => updateSizeVariant(index, 'dimensions', e.target.value)}
                        placeholder="10x15 cm"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Price Diff (৳)
                        </label>
                        <input
                          type="number"
                          value={size.price}
                          onChange={(e) => updateSizeVariant(index, 'price', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={size.stock}
                          onChange={(e) => updateSizeVariant(index, 'stock', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Weight Variants */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Weight className="w-5 h-5 text-orange-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Weight Variants</h4>
                </div>
                <button
                  type="button"
                  onClick={addWeightVariant}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Weight
                </button>
              </div>

              {formData.variants.weights.map((weight, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Weight {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeWeightVariant(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Name (EN)
                      </label>
                      <input
                        type="text"
                        value={weight.name.en}
                        onChange={(e) => updateWeightVariant(index, 'name', { ...weight.name, en: e.target.value })}
                        placeholder="1kg"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Name (BN)
                      </label>
                      <input
                        type="text"
                        value={weight.name.bn}
                        onChange={(e) => updateWeightVariant(index, 'name', { ...weight.name, bn: e.target.value })}
                        placeholder="১ কেজি"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Value
                        </label>
                        <input
                          type="number"
                          value={weight.value}
                          onChange={(e) => updateWeightVariant(index, 'value', parseInt(e.target.value) || 0)}
                          placeholder="1000"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Unit
                        </label>
                        <select
                          value={weight.unit}
                          onChange={(e) => updateWeightVariant(index, 'unit', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Price (৳)
                        </label>
                        <input
                          type="number"
                          value={weight.price}
                          onChange={(e) => updateWeightVariant(index, 'price', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={weight.stock}
                          onChange={(e) => updateWeightVariant(index, 'stock', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Default Variant Selection */}
            {(formData.variants.colors.length > 0 || formData.variants.sizes.length > 0 || formData.variants.weights.length > 0) && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Default Variant Selection</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {formData.variants.colors.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Default Color
                      </label>
                      <select
                        value={formData.defaultVariant.color}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          defaultVariant: { ...prev.defaultVariant, color: e.target.value }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Color</option>
                        {formData.variants.colors.map((color, index) => (
                          <option key={index} value={color.name.en}>
                            {color.name.en} ({color.name.bn})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {formData.variants.sizes.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Default Size
                      </label>
                      <select
                        value={formData.defaultVariant.size}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          defaultVariant: { ...prev.defaultVariant, size: e.target.value }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Size</option>
                        {formData.variants.sizes.map((size, index) => (
                          <option key={index} value={size.name.en}>
                            {size.name.en} ({size.name.bn})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {formData.variants.weights.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Default Weight
                      </label>
                      <select
                        value={formData.defaultVariant.weight}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          defaultVariant: { ...prev.defaultVariant, weight: e.target.value }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Weight</option>
                        {formData.variants.weights.map((weight, index) => (
                          <option key={index} value={weight.name.en}>
                            {weight.name.en} ({weight.name.bn})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Images * (Current: {images.length} existing, {newImages.length} new)
            </label>
            
            {/* Existing Images */}
            {images.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Images:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {newImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">New Images:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
              onDrop={(e) => {
                e.preventDefault();
                
                handleImageUpload(e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  
                  handleImageUpload(e.target.files);
                }}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <ImagePlus className="w-12 h-12 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload images or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB each
                </span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductFormModal; 