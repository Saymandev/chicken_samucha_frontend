import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { publicAPI } from '../utils/api';

interface Promotion {
  _id: string;
  title: {
    en: string;
    bn: string;
  };
  description: {
    en: string;
    bn: string;
  };
  shortDescription?: {
    en: string;
    bn: string;
  };
  image?: {
    url: string;
    public_id: string;
  };
  bannerImage?: {
    url: string;
    public_id: string;
  };
  type: 'discount' | 'special_offer' | 'announcement' | 'seasonal' | 'flash_sale';
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  discountValue: number;
  validUntil: string;
  displayFrequency?: 'once_per_session' | 'once_per_day' | 'always' | 'custom';
  displayRules?: {
    showOnHomepage: boolean;
    showOnProductPage: boolean;
    showOnCartPage: boolean;
    showOnCheckout: boolean;
    minimumOrderAmount: number;
  };
  priority?: number;
  targetAudience?: string;
  ctaButton: {
    text: {
      en: string;
      bn: string;
    };
    link: string;
    action: 'navigate' | 'apply_coupon' | 'open_catalog' | 'contact_us';
  };
  timeRemaining?: number;
  isValid?: boolean;
}

// Check if promotion should be shown based on display frequency
const shouldShowPromotion = (promotion: Promotion, pathname: string): boolean => {
    const sessionKey = `promotion_${promotion._id}_session`;
    const dailyKey = `promotion_${promotion._id}_daily`;
    
    // Provide defaults for missing fields
    const displayFrequency = promotion.displayFrequency || 'always';
    const displayRules = promotion.displayRules || {
      showOnHomepage: true,
      showOnProductPage: false,
      showOnCartPage: false,
      showOnCheckout: false,
      minimumOrderAmount: 0
    };
    
    // Check display rules based on current page
    const getCurrentPageType = () => {
      if (pathname === '/') return 'homepage';
      if (pathname.startsWith('/products')) return 'product';
      if (pathname === '/cart') return 'cart';
      if (pathname === '/checkout') return 'checkout';
      return 'homepage';
    };
    
    const pageType = getCurrentPageType();
    let pageRulePassed = false;
    
    switch (pageType) {
      case 'homepage':
        pageRulePassed = displayRules.showOnHomepage;
        break;
      case 'product':
        pageRulePassed = displayRules.showOnProductPage;
        break;
      case 'cart':
        pageRulePassed = displayRules.showOnCartPage;
        break;
      case 'checkout':
        pageRulePassed = displayRules.showOnCheckout;
        break;
      default:
        pageRulePassed = true;
    }
    
    if (!pageRulePassed) {
      return false;
    }
    
    let shouldShow = false;
    switch (displayFrequency) {
      case 'once_per_session':
        shouldShow = !sessionStorage.getItem(sessionKey);
        break;
      case 'once_per_day':
        const lastShown = localStorage.getItem(dailyKey);
        if (!lastShown) {
          shouldShow = true;
        } else {
          const lastShownDate = new Date(lastShown);
          const today = new Date();
          shouldShow = lastShownDate.toDateString() !== today.toDateString();
        }
        break;
      case 'always':
        shouldShow = true;
        break;
      default:
        shouldShow = true;
        break;
    }
    
    return shouldShow;
};

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Mark promotion as shown
  const markPromotionAsShown = (promotion: Promotion) => {
    const sessionKey = `promotion_${promotion._id}_session`;
    const dailyKey = `promotion_${promotion._id}_daily`;
    
    switch (promotion.displayFrequency) {
      case 'once_per_session':
        sessionStorage.setItem(sessionKey, 'true');
        break;
      case 'once_per_day':
        localStorage.setItem(dailyKey, new Date().toISOString());
        break;
    }
  };

  // Fetch active promotions
  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
    // Get current page type for filtering promotions
    const getCurrentPageType = () => {
      if (location.pathname === '/') return 'homepage';
      if (location.pathname.startsWith('/products')) return 'product';
      if (location.pathname === '/cart') return 'cart';
      if (location.pathname === '/checkout') return 'checkout';
      return 'homepage';
    };
    
    const pageType = getCurrentPageType();
    
    const response = await publicAPI.getActivePromotions({
      page: pageType,
      limit: 5,
      targetAudience: 'all'
    });
    
    if (response.data.success) {
      const promotions = response.data.promotions || [];
      setPromotions(promotions);
      
      // Find the first promotion that should be shown
      const promotionToShow = promotions.find((promotion: Promotion) => shouldShowPromotion(promotion, location.pathname));
      if (promotionToShow) {
        setCurrentPromotion(promotionToShow);
      }
    }
    } catch (error) {
      console.error('❌ Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  }, [location.pathname]);

  // Track promotion view
  const trackPromotionView = async (promotionId: string) => {
    try {
      await publicAPI.trackPromotionView(promotionId);
    } catch (error) {
      console.error('Error tracking promotion view:', error);
    }
  };

  // Track promotion click
  const trackPromotionClick = async (promotionId: string) => {
    try {
      await publicAPI.trackPromotionClick(promotionId);
    } catch (error) {
      console.error('Error tracking promotion click:', error);
    }
  };

  // Close current promotion
  const closePromotion = () => {
    if (currentPromotion) {
      markPromotionAsShown(currentPromotion);
      setCurrentPromotion(null);
    }
  };

  // Handle promotion click
  const handlePromotionClick = async () => {
    if (currentPromotion) {
      await trackPromotionClick(currentPromotion._id);
    }
  };

  // Load promotions on mount and when location changes
  useEffect(() => {
    fetchPromotions();
  }, [location.pathname, fetchPromotions]);

  // Track view when promotion is shown
  useEffect(() => {
    if (currentPromotion) {
      trackPromotionView(currentPromotion._id);
    }
  }, [currentPromotion]);

  return {
    promotions,
    currentPromotion,
    loading,
    closePromotion,
    handlePromotionClick,
    refreshPromotions: fetchPromotions
  };
};
