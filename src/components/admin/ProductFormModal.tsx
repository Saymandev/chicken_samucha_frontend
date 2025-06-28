import { motion } from 'framer-motion';
import { ImagePlus, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { adminAPI } from '../../utils/api';

interface Product {
  _id?: string;
  name: { en: string; bn: string };
  description: { en: string; bn: string };
  price: number;
  discountPrice?: number;
  images: Array<{ url: string; public_id: string }>;
  category: { en: string; bn: string };
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  ingredients?: { en: string; bn: string };
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

const categories = [
  { en: 'Samosa', bn: 'সমুচা' },
  { en: 'Appetizer', bn: 'অ্যাপেটাইজার' },
  { en: 'Snack', bn: 'স্ন্যাক্স' },
  { en: 'Beverage', bn: 'পানীয়' },
  { en: 'Dessert', bn: 'মিষ্টি' }
];

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess
}) => {
  const { language } = useStore();
  const [loading, setLoading] = useState(false);
  
  
  const [formData, setFormData] = useState({
    name: { en: '', bn: '' },
    description: { en: '', bn: '' },
    price: 0,
    discountPrice: 0,
    category: { en: 'Samosa', bn: 'সমুচা' },
    stock: 0,
    isAvailable: true,
    isFeatured: false,
    ingredients: { en: '', bn: '' }
  });
  
  const [images, setImages] = useState<Array<{ url: string; public_id: string }>>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || { en: '', bn: '' },
        description: product.description || { en: '', bn: '' },
        price: product.price || 0,
        discountPrice: product.discountPrice || 0,
        category: product.category || { en: 'Samosa', bn: 'সমুচা' },
        stock: product.stock || 0,
        isAvailable: product.isAvailable ?? true,
        isFeatured: product.isFeatured ?? false,
        ingredients: product.ingredients || { en: '', bn: '' }
      });
      setImages(product.images || []);
    } else {
      // Reset form for new product
      setFormData({
        name: { en: '', bn: '' },
        description: { en: '', bn: '' },
        price: 0,
        discountPrice: 0,
        category: { en: 'Samosa', bn: 'সমুচা' },
        stock: 0,
        isAvailable: true,
        isFeatured: false,
        ingredients: { en: '', bn: '' }
      });
      setImages([]);
    }
    setNewImages([]);
  }, [product, isOpen]);

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
    const selectedCategory = categories.find(cat => cat.en === value);
    if (selectedCategory) {
      setFormData(prev => ({
        ...prev,
        category: selectedCategory
      }));
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    console.log('handleImageUpload called with files:', files);
    if (!files) return;
    
    const fileArray = Array.from(files);
    console.log('File array:', fileArray);
    
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

    console.log('Valid files:', validFiles);
    setNewImages(prev => {
      const updated = [...prev, ...validFiles];
      console.log('Updated newImages state:', updated);
      return updated;
    });
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    // Also check file input directly as backup
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const fileInputFiles = fileInput?.files ? Array.from(fileInput.files) : [];
    
    console.log('Validating form...', { 
      existingImages: images.length, 
      newImages: newImages.length,
      newImagesFiles: newImages,
      fileInputFiles: fileInputFiles.length,
      actualFileInput: fileInputFiles
    });
    
    if (!formData.name.en.trim()) {
      toast.error('English name is required');
      return false;
    }
    if (!formData.name.bn.trim()) {
      console.log('Bengali name is empty, auto-filling with English name');
      // Auto-fill Bengali name with English name if empty
      formData.name.bn = formData.name.en;
    }
    if (!formData.description.en.trim()) {
      toast.error('English description is required');
      return false;
    }
    if (!formData.description.bn.trim()) {
      console.log('Bengali description is empty, auto-filling with English description');
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
      console.log('Image validation failed - no images found in any source');
      toast.error('At least one product image is required');
      return false;
    }
    
    // If we have file input images but they're not in newImages state, add them
    if (hasFileInputImages && !hasNewImages) {
      console.log('Found images in file input but not in state, updating state...');
      setNewImages(fileInputFiles.filter(file => file.type.startsWith('image/')));
    }
    
    console.log('Form validation passed');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submit started. Current state:', {
      images: images.length,
      newImages: newImages.length,
      formData
    });
    
    if (!validateForm()) {
      console.log('Validation failed, stopping submission');
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
      submitData.append('ingredients', JSON.stringify(formData.ingredients));
      
      // Add new image files from state
      console.log('Adding files to FormData:', newImages.length, newImages);
      newImages.forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.type, file.size);
        submitData.append('images', file);
      });
      
      // Also check file input directly as backup
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput?.files && fileInput.files.length > 0 && newImages.length === 0) {
        console.log('Using files directly from input since state is empty');
        Array.from(fileInput.files).forEach(file => {
          if (file.type.startsWith('image/')) {
            console.log('Adding file from input:', file.name, file.type);
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
      console.log('FormData contents:');
      for (let pair of (submitData as any).entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0], 'File:', pair[1].name, pair[1].type, pair[1].size, 'bytes');
        } else {
          console.log(pair[0], pair[1]);
        }
      }
      
      // Double check that we actually have files
      let hasFiles = false;
      for (let pair of (submitData as any).entries()) {
        if (pair[1] instanceof File) {
          hasFiles = true;
          break;
        }
      }
      console.log('FormData has files:', hasFiles);
      
      if (product?._id) {
        // Update existing product
        console.log('Calling updateProduct API...');
        await adminAPI.updateProduct(product._id, submitData);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        console.log('Calling createProduct API...');
        const response = await adminAPI.createProduct(submitData);
        console.log('API Response:', response);
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

          {/* Ingredients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ingredients (English)
              </label>
              <textarea
                value={formData.ingredients.en}
                onChange={(e) => handleInputChange('ingredients', e.target.value, 'en')}
                rows={3}
                placeholder="e.g., Chicken, Flour, Onions, Spices"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ingredients (Bengali)
              </label>
              <textarea
                value={formData.ingredients.bn}
                onChange={(e) => handleInputChange('ingredients', e.target.value, 'bn')}
                rows={3}
                placeholder="যেমন: মুরগির মাংস, ময়দা, পেঁয়াজ, মসলা"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
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
                value={formData.category.en}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                {categories.map((category) => (
                  <option key={category.en} value={category.en}>
                    {language === 'bn' ? category.bn : category.en}
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
                console.log('Drop event triggered');
                handleImageUpload(e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  console.log('File input change event triggered');
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