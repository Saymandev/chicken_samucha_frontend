import { motion } from 'framer-motion';
import { Edit, FileText, Image, Settings, Trash2, Upload, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, contentAPI } from '../../utils/api';

interface HeroContent {
  title: { en: string; bn: string };
  subtitle: { en: string; bn: string };
  description: { en: string; bn: string };
  buttonText: { en: string; bn: string };
  backgroundImage: { url: string; public_id: string };
}

interface SliderItem {
  _id: string;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  image: { url: string; public_id: string };
  linkUrl: string;
  buttonText: { en: string; bn: string };
  isActive: boolean;
  order: number;
}

interface PaymentSettings {
  bkash: { enabled: boolean; merchantNumber: string; apiKey: string };
  nagad: { enabled: boolean; merchantNumber: string; apiKey: string };
  rocket: { enabled: boolean; merchantNumber: string; apiKey: string };
  upay: { enabled: boolean; merchantNumber: string; apiKey: string };
  cashOnDelivery: { enabled: boolean; deliveryCharge: number };
}

const AdminContent: React.FC = () => {
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [deliverySettings, setDeliverySettings] = useState<{ deliveryCharge: number; freeDeliveryThreshold: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hero' | 'slider' | 'payments' | 'delivery'>('hero');
  const [newSliderItem, setNewSliderItem] = useState<SliderItem | null>(null);
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null);
  const [showSliderModal, setShowSliderModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch hero content
      const heroResponse = await adminAPI.getHeroContent();
      if (heroResponse.data.success) {
        setHeroContent(heroResponse.data.content);
      }

      // Fetch slider items
      const sliderResponse = await contentAPI.getSliderItems();
      if (sliderResponse.data.success) {
        setSliderItems(sliderResponse.data.sliderItems || []);
      }

      // Fetch payment settings
      const paymentResponse = await adminAPI.getPaymentSettings();
      if (paymentResponse.data.success) {
        setPaymentSettings(paymentResponse.data.settings);
      }

      // Fetch system settings (delivery)
      try {
        const systemResponse = await adminAPI.getSystemSettings();
        if (systemResponse.data.success) {
          const s = systemResponse.data.settings;
          setDeliverySettings({
            deliveryCharge: s?.general?.deliveryCharge ?? 60,
            freeDeliveryThreshold: s?.delivery?.freeDeliveryThreshold ?? 500
          });
        }
      } catch {}
      
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to fetch content data');
      
      // Set empty defaults if API fails
      setHeroContent({
        title: { en: '', bn: '' },
        subtitle: { en: '', bn: '' },
        description: { en: '', bn: '' },
        buttonText: { en: '', bn: '' },
        backgroundImage: { url: '', public_id: '' }
      });
      setSliderItems([]);
      setPaymentSettings({
        bkash: { enabled: false, merchantNumber: '', apiKey: '' },
        nagad: { enabled: false, merchantNumber: '', apiKey: '' },
        rocket: { enabled: false, merchantNumber: '', apiKey: '' },
        upay: { enabled: false, merchantNumber: '', apiKey: '' },
        cashOnDelivery: { enabled: false, deliveryCharge: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHeroContent = async () => {
    if (!heroContent) return;
    
    try {
      setSavingSettings(true);
      await adminAPI.updateHeroContent(heroContent);
      toast.success('Hero content updated successfully');
    } catch (error) {
      console.error('Update hero content error:', error);
      toast.error('Failed to update hero content');
    } finally {
      setSavingSettings(false);
    }
  };

  const updatePaymentSettings = async () => {
    if (!paymentSettings) return;
    
    try {
      setSavingSettings(true);
      await adminAPI.updatePaymentSettings(paymentSettings);
      toast.success('Payment settings updated successfully');
    } catch (error) {
      console.error('Update payment settings error:', error);
      toast.error('Failed to update payment settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleSliderItem = async (itemId: string) => {
    try {
      await adminAPI.toggleSliderItem(itemId);
      toast.success('Slider item updated');
      
      // Refresh slider items
      const response = await contentAPI.getSliderItems();
      if (response.data.success) {
        setSliderItems(response.data.sliderItems || []);
      }
    } catch (error) {
      toast.error('Failed to update slider item');
    }
  };

  const openSliderModal = () => {
    setNewSliderItem({
      _id: '',
      title: { en: '', bn: '' },
      description: { en: '', bn: '' },
      image: { url: '', public_id: '' },
      linkUrl: '',
      buttonText: { en: '', bn: '' },
      isActive: true,
      order: sliderItems.length + 1
    });
    setSelectedImage(null);
    setShowSliderModal(true);
  };

  const closeSliderModal = () => {
    setNewSliderItem(null);
    setEditingSlider(null);
    setSelectedImage(null);
    setShowSliderModal(false);
  };

  const handleEditSlider = (item: SliderItem) => {
    setEditingSlider(item);
    setNewSliderItem(item);
    setSelectedImage(null); // Don't pre-select image for editing
    setShowSliderModal(true);
  };

  const handleDeleteSlider = async (itemId: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSavingSettings(true);
      await contentAPI.deleteSliderItem(itemId);
      toast.success('Slider item deleted successfully');
      
      // Refresh slider items
      const response = await contentAPI.getSliderItems();
      if (response.data.success) {
        setSliderItems(response.data.sliderItems || []);
      }
    } catch (error) {
      console.error('Delete slider item error:', error);
      toast.error('Failed to delete slider item');
    } finally {
      setSavingSettings(false);
    }
  };

  const createOrUpdateSliderItem = async () => {
    if (!newSliderItem) return;
    
    if (!editingSlider && !selectedImage) {
      toast.error('Please select an image for the slider');
      return;
    }
    
    try {
      setSavingSettings(true);
      const formData = new FormData();
      formData.append('title[en]', newSliderItem.title.en);
      formData.append('title[bn]', newSliderItem.title.bn || newSliderItem.title.en);
      formData.append('description[en]', newSliderItem.description.en);
      formData.append('description[bn]', newSliderItem.description.bn || newSliderItem.description.en);
      formData.append('linkUrl', newSliderItem.linkUrl);
      formData.append('buttonText[en]', newSliderItem.buttonText.en);
      formData.append('buttonText[bn]', newSliderItem.buttonText.bn || newSliderItem.buttonText.en);
      formData.append('isActive', String(newSliderItem.isActive));
      formData.append('order', String(newSliderItem.order));
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      if (editingSlider) {
        // Update existing slider
        await contentAPI.updateSliderItem(editingSlider._id, formData);
        toast.success('Slider item updated successfully');
      } else {
        // Create new slider
        await contentAPI.createSliderItem(formData);
        toast.success('Slider item created successfully');
      }
      
      // Refresh slider items
      const response = await contentAPI.getSliderItems();
      if (response.data.success) {
        setSliderItems(response.data.sliderItems || []);
      }
      
      closeSliderModal();
    } catch (error) {
      console.error('Save slider item error:', error);
      toast.error(`Failed to ${editingSlider ? 'update' : 'create'} slider item`);
    } finally {
      setSavingSettings(false);
    }
  };

  const PaymentMethodCard = ({ 
    method, 
    settings, 
    onToggle, 
    onUpdate 
  }: { 
    method: string; 
    settings: any; 
    onToggle: () => void; 
    onUpdate: (field: string, value: any) => void; 
  }) => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
          {method === 'cashOnDelivery' ? 'Cash on Delivery' : method}
        </h4>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={onToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
        </label>
      </div>

      {settings.enabled && (
        <div className="space-y-3">
          {method !== 'cashOnDelivery' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Merchant Number
                </label>
                <input
                  type="text"
                  value={settings.merchantNumber}
                  onChange={(e) => onUpdate('merchantNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  placeholder="Enter merchant number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => onUpdate('apiKey', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  placeholder="Enter API key"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Charge (৳)
              </label>
              <input
                type="number"
                value={settings.deliveryCharge}
                onChange={(e) => onUpdate('deliveryCharge', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                placeholder="Enter delivery charge"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Content Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage website content, delivery, and Bangladesh payment settings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: 'hero', label: 'Hero Section', icon: <Image className="w-4 h-4" /> },
              { id: 'slider', label: 'Slider Items', icon: <FileText className="w-4 h-4" /> },
              { id: 'payments', label: 'BD Payments', icon: <Settings className="w-4 h-4" /> },
              { id: 'delivery', label: 'Delivery', icon: <Settings className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Content Tab */}
        {activeTab === 'hero' && heroContent && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Hero Section Content
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (English)
                </label>
                <input
                  type="text"
                  value={heroContent.title.en}
                  onChange={(e) => setHeroContent({
                    ...heroContent,
                    title: { ...heroContent.title, en: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter English title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (Bengali)
                </label>
                <input
                  type="text"
                  value={heroContent.title.bn}
                  onChange={(e) => setHeroContent({
                    ...heroContent,
                    title: { ...heroContent.title, bn: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="বাংলা শিরোনাম লিখুন"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtitle (English)
                </label>
                <input
                  type="text"
                  value={heroContent.subtitle.en}
                  onChange={(e) => setHeroContent({
                    ...heroContent,
                    subtitle: { ...heroContent.subtitle, en: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter English subtitle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtitle (Bengali)
                </label>
                <input
                  type="text"
                  value={heroContent.subtitle.bn}
                  onChange={(e) => setHeroContent({
                    ...heroContent,
                    subtitle: { ...heroContent.subtitle, bn: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="বাংলা উপশিরোনাম লিখুন"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={updateHeroContent}
                disabled={savingSettings}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  savingSettings 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white`}
              >
                {savingSettings ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Update Hero Content'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Delivery Settings Tab */}
        {activeTab === 'delivery' && deliverySettings && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Delivery Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Charge (৳)</label>
                <input
                  type="number"
                  value={deliverySettings.deliveryCharge}
                  onChange={(e) => setDeliverySettings(ds => ds ? { ...ds, deliveryCharge: parseInt(e.target.value) || 0 } : ds)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Free Delivery Threshold (৳)</label>
                <input
                  type="number"
                  value={deliverySettings.freeDeliveryThreshold}
                  onChange={(e) => setDeliverySettings(ds => ds ? { ...ds, freeDeliveryThreshold: parseInt(e.target.value) || 0 } : ds)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={async () => {
                  if (!deliverySettings) return;
                  try {
                    setSavingSettings(true);
                    await adminAPI.updateSystemSettings({
                      general: { deliveryCharge: deliverySettings.deliveryCharge },
                      delivery: { freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold }
                    });
                    toast.success('Delivery settings updated successfully');
                  } catch (e) {
                    toast.error('Failed to update delivery settings');
                  } finally {
                    setSavingSettings(false);
                  }
                }}
                disabled={savingSettings}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  savingSettings ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
                } text-white`}
              >
                {savingSettings ? 'Saving...' : 'Save Delivery Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Slider Tab */}
        {activeTab === 'slider' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Slider Items
              </h2>
              <button 
                onClick={openSliderModal}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Add New Slider
              </button>
            </div>

            {sliderItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sliderItems.map((item) => (
                  <div key={item._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    {/* Slider Image */}
                    <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                      {item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={item.title.en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.isActive 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Order Badge */}
                      <div className="absolute top-2 right-2">
                        <span className="bg-black bg-opacity-50 text-white px-2 py-1 text-xs rounded-full">
                          #{item.order}
                        </span>
                      </div>
                    </div>

                    {/* Slider Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                        {item.title.en}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {item.description.en}
                      </p>
                      
                      {item.linkUrl && (
                        <p className="text-blue-600 dark:text-blue-400 text-xs mb-3 truncate">
                          → {item.linkUrl}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSlider(item)}
                          className="flex-1 flex items-center justify-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleSliderItem(item._id)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                            item.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {item.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteSlider(item._id, item.title.en)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <Upload className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No slider items found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Add slider items to showcase special offers and promotions
                </p>
                <button 
                  onClick={openSliderModal}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add First Slider Item
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bangladesh Payments Tab */}
        {activeTab === 'payments' && paymentSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Bangladesh Mobile Payment Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PaymentMethodCard
                method="bkash"
                settings={paymentSettings.bkash}
                onToggle={() => setPaymentSettings({
                  ...paymentSettings,
                  bkash: { ...paymentSettings.bkash, enabled: !paymentSettings.bkash.enabled }
                })}
                onUpdate={(field, value) => setPaymentSettings({
                  ...paymentSettings,
                  bkash: { ...paymentSettings.bkash, [field]: value }
                })}
              />

              <PaymentMethodCard
                method="nagad"
                settings={paymentSettings.nagad}
                onToggle={() => setPaymentSettings({
                  ...paymentSettings,
                  nagad: { ...paymentSettings.nagad, enabled: !paymentSettings.nagad.enabled }
                })}
                onUpdate={(field, value) => setPaymentSettings({
                  ...paymentSettings,
                  nagad: { ...paymentSettings.nagad, [field]: value }
                })}
              />

              <PaymentMethodCard
                method="rocket"
                settings={paymentSettings.rocket}
                onToggle={() => setPaymentSettings({
                  ...paymentSettings,
                  rocket: { ...paymentSettings.rocket, enabled: !paymentSettings.rocket.enabled }
                })}
                onUpdate={(field, value) => setPaymentSettings({
                  ...paymentSettings,
                  rocket: { ...paymentSettings.rocket, [field]: value }
                })}
              />

              <PaymentMethodCard
                method="upay"
                settings={paymentSettings.upay}
                onToggle={() => setPaymentSettings({
                  ...paymentSettings,
                  upay: { ...paymentSettings.upay, enabled: !paymentSettings.upay.enabled }
                })}
                onUpdate={(field, value) => setPaymentSettings({
                  ...paymentSettings,
                  upay: { ...paymentSettings.upay, [field]: value }
                })}
              />

              <PaymentMethodCard
                method="cashOnDelivery"
                settings={paymentSettings.cashOnDelivery}
                onToggle={() => setPaymentSettings({
                  ...paymentSettings,
                  cashOnDelivery: { ...paymentSettings.cashOnDelivery, enabled: !paymentSettings.cashOnDelivery.enabled }
                })}
                onUpdate={(field, value) => setPaymentSettings({
                  ...paymentSettings,
                  cashOnDelivery: { ...paymentSettings.cashOnDelivery, [field]: value }
                })}
              />
            </div>

            <div className="mt-6">
              <button
                onClick={updatePaymentSettings}
                disabled={savingSettings}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  savingSettings 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white`}
              >
                {savingSettings ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Update Payment Settings'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slider Creation Modal */}
      {showSliderModal && newSliderItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingSlider ? 'Edit Slider Item' : 'Create New Slider Item'}
              </h3>
              <button
                onClick={closeSliderModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Title Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    value={newSliderItem.title.en}
                    onChange={(e) => setNewSliderItem({
                      ...newSliderItem,
                      title: { ...newSliderItem.title, en: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter English title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title (Bengali)
                  </label>
                  <input
                    type="text"
                    value={newSliderItem.title.bn}
                    onChange={(e) => setNewSliderItem({
                      ...newSliderItem,
                      title: { ...newSliderItem.title, bn: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="বাংলা শিরোনাম লিখুন"
                  />
                </div>
              </div>

              {/* Description Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (English) *
                  </label>
                  <textarea
                    value={newSliderItem.description.en}
                    onChange={(e) => setNewSliderItem({
                      ...newSliderItem,
                      description: { ...newSliderItem.description, en: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter English description"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Bengali)
                  </label>
                  <textarea
                    value={newSliderItem.description.bn}
                    onChange={(e) => setNewSliderItem({
                      ...newSliderItem,
                      description: { ...newSliderItem.description, bn: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="বাংলা বিবরণ লিখুন"
                  />
                </div>
              </div>

              {/* Button Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Button Text (English)
                  </label>
                  <input
                    type="text"
                    value={newSliderItem.buttonText.en}
                    onChange={(e) => setNewSliderItem({
                      ...newSliderItem,
                      buttonText: { ...newSliderItem.buttonText, en: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Order Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Button Text (Bengali)
                  </label>
                  <input
                    type="text"
                    value={newSliderItem.buttonText.bn}
                    onChange={(e) => setNewSliderItem({
                      ...newSliderItem,
                      buttonText: { ...newSliderItem.buttonText, bn: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="যেমন, এখনই অর্ডার করুন"
                  />
                </div>
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link URL
                </label>
                <input
                  type="text"
                  value={newSliderItem.linkUrl}
                  onChange={(e) => setNewSliderItem({
                    ...newSliderItem,
                    linkUrl: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., /products, /contact"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slider Image {!editingSlider ? '*' : ''}
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    className="hidden"
                    id="slider-image-upload"
                  />
                  <label
                    htmlFor="slider-image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedImage 
                        ? selectedImage.name 
                        : editingSlider 
                          ? 'Click to change image (optional)'
                          : 'Click to upload image'
                      }
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Recommended: 800x500px, Max: 5MB
                    </p>
                    {editingSlider && editingSlider.image?.url && !selectedImage && (
                      <div className="mt-3">
                        <img 
                          src={editingSlider.image.url} 
                          alt="Current" 
                          className="w-24 h-16 object-cover rounded-lg border"
                        />
                        <p className="text-xs text-gray-500 mt-1">Current image</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="slider-active"
                  checked={newSliderItem.isActive}
                  onChange={(e) => setNewSliderItem({
                    ...newSliderItem,
                    isActive: e.target.checked
                  })}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="slider-active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active (show in slider)
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeSliderModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createOrUpdateSliderItem}
                disabled={savingSettings || !newSliderItem.title.en || !newSliderItem.description.en || (!editingSlider && !selectedImage)}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  savingSettings || !newSliderItem.title.en || !newSliderItem.description.en || (!editingSlider && !selectedImage)
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white`}
              >
                {savingSettings ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingSlider ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingSlider ? 'Update Slider Item' : 'Create Slider Item'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
