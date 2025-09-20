import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

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
  displayFrequency: 'once_per_session' | 'once_per_day' | 'always' | 'custom';
  ctaButton: {
    text: {
      en: string;
      bn: string;
    };
    link: string;
    action: 'navigate' | 'apply_coupon' | 'open_catalog' | 'contact_us';
  };
  timeRemaining: number;
  isValid: boolean;
}

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Get current page type for filtering promotions
  const getCurrentPageType = () => {
    if (location.pathname === '/') return 'homepage';
    if (location.pathname.startsWith('/products')) return 'product';
    if (location.pathname === '/cart') return 'cart';
    if (location.pathname === '/checkout') return 'checkout';
    return 'homepage';
  };

  // Check if promotion should be shown based on display frequency
  const shouldShowPromotion = (promotion: Promotion): boolean => {
    const sessionKey = `promotion_${promotion._id}_session`;
    const dailyKey = `promotion_${promotion._id}_daily`;
    
    switch (promotion.displayFrequency) {
      case 'once_per_session':
        return !sessionStorage.getItem(sessionKey);
      case 'once_per_day':
        const lastShown = localStorage.getItem(dailyKey);
        if (!lastShown) return true;
        const lastShownDate = new Date(lastShown);
        const today = new Date();
        return lastShownDate.toDateString() !== today.toDateString();
      case 'always':
        return true;
      default:
        return true;
    }
  };

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
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const pageType = getCurrentPageType();
      const response = await fetch(
        `/api/promotions?page=${pageType}&limit=5&targetAudience=all`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPromotions(data.promotions || []);
          
          // Find the first promotion that should be shown
          const promotionToShow = data.promotions.find(shouldShowPromotion);
          if (promotionToShow) {
            setCurrentPromotion(promotionToShow);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track promotion view
  const trackPromotionView = async (promotionId: string) => {
    try {
      await fetch(`/api/promotions/${promotionId}/view`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error tracking promotion view:', error);
    }
  };

  // Track promotion click
  const trackPromotionClick = async (promotionId: string) => {
    try {
      await fetch(`/api/promotions/${promotionId}/click`, {
        method: 'POST',
      });
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
  }, [location.pathname]);

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
