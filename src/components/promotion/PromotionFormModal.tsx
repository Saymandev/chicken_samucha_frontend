import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

interface PromotionFormData {
  title: {
    en: string;
    bn: string;
  };
  description: {
    en: string;
    bn: string;
  };
  shortDescription: {
    en: string;
    bn: string;
  };
  type: 'discount' | 'special_offer' | 'announcement' | 'seasonal' | 'flash_sale';
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  discountValue: number;
  validFrom: string;
  validUntil: string;
  priority: number;
  targetAudience: 'all' | 'new_users' | 'returning_users' | 'vip_users';
  displayFrequency: 'once_per_session' | 'once_per_day' | 'always' | 'custom';
  displayRules: {
    showOnHomepage: boolean;
    showOnProductPage: boolean;
    showOnCartPage: boolean;
    showOnCheckout: boolean;
    minimumOrderAmount: number;
  };
  ctaButton: {
    text: {
      en: string;
      bn: string;
    };
    link: string;
    action: 'navigate' | 'apply_coupon' | 'open_catalog' | 'contact_us';
  };
}

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotion?: any; // For editing
  onSuccess: () => void;
}

const PromotionFormModal: React.FC<PromotionFormModalProps> = ({
  isOpen,
  onClose,
  promotion,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    title: { en: '', bn: '' },
    description: { en: '', bn: '' },
    shortDescription: { en: '', bn: '' },
    type: 'discount',
    discountType: 'percentage',
    discountValue: 0,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    priority: 1,
    targetAudience: 'all',
    displayFrequency: 'once_per_session',
    displayRules: {
      showOnHomepage: true,
      showOnProductPage: false,
      showOnCartPage: false,
      showOnCheckout: false,
      minimumOrderAmount: 0
    },
    ctaButton: {
      text: { en: 'Shop Now', bn: 'এখনই কিনুন' },
      link: '/products',
      action: 'navigate'
    }
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title || { en: '', bn: '' },
        description: promotion.description || { en: '', bn: '' },
        shortDescription: promotion.shortDescription || { en: '', bn: '' },
        type: promotion.type || 'discount',
        discountType: promotion.discountType || 'percentage',
        discountValue: promotion.discountValue || 0,
        validFrom: promotion.validFrom ? new Date(promotion.validFrom).toISOString().slice(0, 16) : '',
        validUntil: promotion.validUntil ? new Date(promotion.validUntil).toISOString().slice(0, 16) : '',
        priority: promotion.priority || 1,
        targetAudience: promotion.targetAudience || 'all',
        displayFrequency: promotion.displayFrequency || 'once_per_session',
        displayRules: promotion.displayRules || {
          showOnHomepage: true,
          showOnProductPage: false,
          showOnCartPage: false,
          showOnCheckout: false,
          minimumOrderAmount: 0
        },
        ctaButton: promotion.ctaButton || {
          text: { en: 'Shop Now', bn: 'এখনই কিনুন' },
          link: '/products',
          action: 'navigate'
        }
      });
      setImagePreview(promotion.image?.url || null);
      setBannerPreview(promotion.bannerImage?.url || null);
    } else {
      // Reset form for new promotion
      setFormData({
        title: { en: '', bn: '' },
        description: { en: '', bn: '' },
        shortDescription: { en: '', bn: '' },
        type: 'discount',
        discountType: 'percentage',
        discountValue: 0,
        validFrom: new Date().toISOString().slice(0, 16),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        priority: 1,
        targetAudience: 'all',
        displayFrequency: 'once_per_session',
        displayRules: {
          showOnHomepage: true,
          showOnProductPage: false,
          showOnCartPage: false,
          showOnCheckout: false,
          minimumOrderAmount: 0
        },
        ctaButton: {
          text: { en: 'Shop Now', bn: 'এখনই কিনুন' },
          link: '/products',
          action: 'navigate'
        }
      });
      setImagePreview(null);
      setBannerPreview(null);
    }
  }, [promotion, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (field: string, subField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof typeof prev] as object || {}),
        [subField]: value
      }
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'image') {
          setImagePreview(e.target?.result as string);
        } else {
          setBannerPreview(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('title[en]', formData.title.en);
      formDataToSend.append('title[bn]', formData.title.bn);
      formDataToSend.append('description[en]', formData.description.en);
      formDataToSend.append('description[bn]', formData.description.bn);
      formDataToSend.append('shortDescription[en]', formData.shortDescription.en);
      formDataToSend.append('shortDescription[bn]', formData.shortDescription.bn);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('discountType', formData.discountType);
      formDataToSend.append('discountValue', formData.discountValue.toString());
      formDataToSend.append('validFrom', new Date(formData.validFrom).toISOString());
      formDataToSend.append('validUntil', new Date(formData.validUntil).toISOString());
      formDataToSend.append('priority', formData.priority.toString());
      formDataToSend.append('targetAudience', formData.targetAudience);
      formDataToSend.append('displayFrequency', formData.displayFrequency);
      formDataToSend.append('displayRules[showOnHomepage]', formData.displayRules.showOnHomepage.toString());
      formDataToSend.append('displayRules[showOnProductPage]', formData.displayRules.showOnProductPage.toString());
      formDataToSend.append('displayRules[showOnCartPage]', formData.displayRules.showOnCartPage.toString());
      formDataToSend.append('displayRules[showOnCheckout]', formData.displayRules.showOnCheckout.toString());
      formDataToSend.append('displayRules[minimumOrderAmount]', formData.displayRules.minimumOrderAmount.toString());
      formDataToSend.append('ctaButton[text][en]', formData.ctaButton.text.en);
      formDataToSend.append('ctaButton[text][bn]', formData.ctaButton.text.bn);
      formDataToSend.append('ctaButton[link]', formData.ctaButton.link);
      formDataToSend.append('ctaButton[action]', formData.ctaButton.action);

      // Add images
      const imageFile = (document.getElementById('image') as HTMLInputElement)?.files?.[0];
      const bannerFile = (document.getElementById('bannerImage') as HTMLInputElement)?.files?.[0];
      
      if (imageFile) formDataToSend.append('image', imageFile);
      if (bannerFile) formDataToSend.append('bannerImage', bannerFile);

      if (promotion) {
        await adminAPI.updatePromotion(promotion._id, formDataToSend);
        toast.success('Promotion updated successfully');
      } else {
        await adminAPI.createPromotion(formDataToSend);
        toast.success('Promotion created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('Failed to save promotion');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {promotion ? 'Edit Promotion' : 'Create Promotion'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title (English)
                    </label>
                    <input
                      type="text"
                      value={formData.title.en}
                      onChange={(e) => handleNestedInputChange('title', 'en', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title (Bengali)
                    </label>
                    <input
                      type="text"
                      value={formData.title.bn}
                      onChange={(e) => handleNestedInputChange('title', 'bn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Description
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (English)
                    </label>
                    <textarea
                      value={formData.description.en}
                      onChange={(e) => handleNestedInputChange('description', 'en', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (Bengali)
                    </label>
                    <textarea
                      value={formData.description.bn}
                      onChange={(e) => handleNestedInputChange('description', 'bn', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Promotion Type & Discount */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Promotion Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="discount">Discount</option>
                      <option value="special_offer">Special Offer</option>
                      <option value="flash_sale">Flash Sale</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => handleInputChange('discountType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed Amount</option>
                      <option value="buy_x_get_y">Buy X Get Y</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Validity Period
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valid From
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => handleInputChange('validFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valid Until
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange('validUntil', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Short Description
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Short Description (English)
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription.en}
                      onChange={(e) => handleNestedInputChange('shortDescription', 'en', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Brief description for the promotion"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Short Description (Bengali)
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription.bn}
                      onChange={(e) => handleNestedInputChange('shortDescription', 'bn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="প্রচারের জন্য সংক্ষিপ্ত বিবরণ"
                    />
                  </div>
                </div>
              </div>

              {/* Priority & Target Audience */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority (1-10)
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Users</option>
                      <option value="new_users">New Users</option>
                      <option value="returning_users">Returning Users</option>
                      <option value="vip_users">VIP Users</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Frequency
                    </label>
                    <select
                      value={formData.displayFrequency}
                      onChange={(e) => handleInputChange('displayFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="once_per_session">Once Per Session</option>
                      <option value="once_per_day">Once Per Day</option>
                      <option value="always">Always</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Display Rules */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Display Rules
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.displayRules.showOnHomepage}
                      onChange={(e) => handleNestedInputChange('displayRules', 'showOnHomepage', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Homepage</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.displayRules.showOnProductPage}
                      onChange={(e) => handleNestedInputChange('displayRules', 'showOnProductPage', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Product Page</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.displayRules.showOnCartPage}
                      onChange={(e) => handleNestedInputChange('displayRules', 'showOnCartPage', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Cart Page</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.displayRules.showOnCheckout}
                      onChange={(e) => handleNestedInputChange('displayRules', 'showOnCheckout', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Checkout</label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Order Amount (৳)
                  </label>
                  <input
                    type="number"
                    value={formData.displayRules.minimumOrderAmount}
                    onChange={(e) => handleNestedInputChange('displayRules', 'minimumOrderAmount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                  />
                </div>
              </div>

              {/* CTA Button */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Call to Action Button
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Button Text (English)
                    </label>
                    <input
                      type="text"
                      value={formData.ctaButton.text.en}
                      onChange={(e) => handleInputChange('ctaButton', {...formData.ctaButton, text: {...formData.ctaButton.text, en: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Button Text (Bengali)
                    </label>
                    <input
                      type="text"
                      value={formData.ctaButton.text.bn}
                      onChange={(e) => handleInputChange('ctaButton', {...formData.ctaButton, text: {...formData.ctaButton.text, bn: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="এখনই কিনুন"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={formData.ctaButton.link}
                      onChange={(e) => handleInputChange('ctaButton', {...formData.ctaButton, link: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="/products"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Button Action
                    </label>
                    <select
                      value={formData.ctaButton.action}
                      onChange={(e) => handleInputChange('ctaButton', {...formData.ctaButton, action: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="navigate">Navigate</option>
                      <option value="apply_coupon">Apply Coupon</option>
                      <option value="open_catalog">Open Catalog</option>
                      <option value="contact_us">Contact Us</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Images
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Promotion Image
                    </label>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'image')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mt-2 w-full h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Banner Image
                    </label>
                    <input
                      id="bannerImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'banner')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    />
                    {bannerPreview && (
                      <img
                        src={bannerPreview}
                        alt="Banner Preview"
                        className="mt-2 w-full h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (promotion ? 'Update Promotion' : 'Create Promotion')}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromotionFormModal;
